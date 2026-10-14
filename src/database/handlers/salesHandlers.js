import { execute, query, queryRow } from '../db';
import {
  toInt,
  toISODate,
  normalizePaymentMethod,
  normalizeStatus,
  normalizePaymentType,
  logAction,
} from './helpers';
import {
  getNominalAccount,
  getOrCreateSystemAccount,
  recalculateLedgerBalances,
} from './accountHandlers';
import { adjustProductStock } from './productHandlers';
import { generateSalesBillNo } from './billUtils';

export const getAllSales = async () => {
  return query(`
    SELECT s.*, c.clientName, p.productName
    FROM sales s
    LEFT JOIN clients c ON s.clientId = c.id
    LEFT JOIN products p ON s.productId = p.id
    ORDER BY s.createdAt DESC
  `);
};

export const getSalesById = async (id) => {
  return queryRow(
    `SELECT s.*, c.clientName, p.productName
     FROM sales s
     LEFT JOIN clients c ON s.clientId = c.id
     LEFT JOIN products p ON s.productId = p.id
     WHERE s.id = ?`,
    [id]
  );
};

export const getPaginatedSales = async ({
  page = 1,
  limit = 20,
  search = '',
  status = '',
  paymentMethod = '',
}) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT s.*, c.clientName, p.productName
    FROM sales s
    LEFT JOIN clients c ON s.clientId = c.id
    LEFT JOIN products p ON s.productId = p.id
    WHERE 1=1
  `;
  const params = [];

  if (search?.trim()) {
    sql += ' AND (c.clientName LIKE ? OR s.billNo LIKE ? OR p.productName LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  if (status) {
    sql += ' AND s.statusOfTransaction = ?';
    params.push(status);
  }

  if (paymentMethod) {
    sql += ' AND s.paymentMethod = ?';
    params.push(paymentMethod);
  }

  sql += ' ORDER BY s.date DESC, s.createdAt DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return query(sql, params);
};

export const applySaleEffects = async (sale, saleId) => {
  const {
    clientId,
    productId,
    quantity = 1,
    totalAmountWithTax = 0,
    totalAmountWithoutTax = 0,
    taxAmount = 0,
    freightCharges = 0,
    paidAmount = 0,
    payments,
    billNo,
    date,
    isMultiProduct = 0,
    multipleProducts = '[]',
  } = sale;

  const total = Number(totalAmountWithTax || 0);
  const paid = Number(paidAmount || 0);

  // 1. STOCK DEDUCTION
  if (isMultiProduct === 1) {
    const pList =
      typeof multipleProducts === 'string'
        ? JSON.parse(multipleProducts || '[]')
        : multipleProducts || [];
    for (const item of pList) {
      if (item.productId) {
        await adjustProductStock(item.productId, -Number(item.quantity || 1));
      }
    }
  } else if (productId) {
    await adjustProductStock(productId, -Number(quantity || 1));
  }

  // 2. CLIENT ACCOUNT CHECK
  const client = await queryRow('SELECT * FROM clients WHERE id = ?', [clientId]);
  if (!client?.accountId) {
    throw new Error('Client account missing for double-entry ledger');
  }

  const clientAccount = await queryRow('SELECT * FROM accounts WHERE id = ?', [
    client.accountId,
  ]);

  // Accrual Entry 1: Debit Client (Debtor)
  await execute(
    `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
     VALUES (?, ?, 'debit', ?, 0, 'Sales', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
    [
      clientAccount.id,
      clientId,
      total,
      saleId,
      `Sales Invoice ${billNo || '-'} to ${client.clientName}`,
      date || null,
    ]
  );

  // Accrual Entry 2: Credit Sales Revenue nominal account
  const salesAcc = await getNominalAccount('Sales Revenue', 'Sales');
  await execute(
    `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
     VALUES (?, null, 'credit', ?, 0, 'Sales', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
    [
      salesAcc.id,
      Number(totalAmountWithoutTax || 0) + Number(freightCharges || 0),
      saleId,
      `Sales Revenue for Bill ${billNo || '-'} to ${client.clientName}`,
      date || null,
    ]
  );

  // Accrual Entry 3: Credit GST Tax nominal account if tax applied
  let taxSum = Number(taxAmount || 0);
  if (taxSum > 0) {
    const taxAcc = await getNominalAccount('GST Tax Account', 'Tax');
    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
       VALUES (?, null, 'credit', ?, 0, 'Sales', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [taxAcc.id, taxSum, saleId, `GST Tax on Bill ${billNo || '-'}`, date || null]
    );
    await recalculateLedgerBalances(taxAcc.id);
  }

  await recalculateLedgerBalances(salesAcc.id);

  // 3. IMMEDIATE PAYMENTS POSTING
  if (paid > 0) {
    let parsedPayments =
      typeof payments === 'string' ? JSON.parse(payments || '[]') : payments || [];
    if (!Array.isArray(parsedPayments) || parsedPayments.length === 0) {
      parsedPayments = [
        {
          method: sale.paymentMethod || 'bank',
          amount: paid,
          accountId: null,
        },
      ];
    }

    for (const payment of parsedPayments) {
      const splitAmount = Number(payment.amount || 0);
      if (splitAmount <= 0) continue;

      let accountToUse = null;
      const m = normalizePaymentMethod(payment.method);
      if (payment.accountId) {
        accountToUse = await queryRow('SELECT * FROM accounts WHERE id = ?', [
          payment.accountId,
        ]);
      }
      if (!accountToUse) {
        accountToUse = await getOrCreateSystemAccount(m === 'cash' ? 'cash' : 'bank');
      }

      // Debit Cash/Bank (increasing asset)
      await execute(
        `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
         VALUES (?, null, 'debit', ?, 0, 'Payment', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [
          accountToUse.id,
          splitAmount,
          saleId,
          `Payment received from ${client.clientName} (Bill ${billNo || '-'})`,
          date || null,
        ]
      );

      // Credit Client (reducing outstanding debtor balance)
      await execute(
        `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
         VALUES (?, ?, 'credit', ?, 0, 'Payment', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [
          clientAccount.id,
          clientId,
          splitAmount,
          saleId,
          `Payment for Bill ${billNo || '-'}`,
          date || null,
        ]
      );

      await recalculateLedgerBalances(accountToUse.id);
    }
  }

  // Recalculate client balance
  await recalculateLedgerBalances(clientAccount.id);
};

export const rollbackSaleEffects = async (oldSale) => {
  const { id, clientId, productId, quantity, isMultiProduct, multipleProducts } =
    oldSale;

  // 1. Stock rollback
  if (isMultiProduct === 1) {
    const pList =
      typeof multipleProducts === 'string'
        ? JSON.parse(multipleProducts || '[]')
        : multipleProducts || [];
    for (const item of pList) {
      if (item.productId) {
        await adjustProductStock(item.productId, Number(item.quantity || 1));
      }
    }
  } else if (productId) {
    await adjustProductStock(productId, Number(quantity || 1));
  }

  // 2. Delete ledger entries created by this sale
  const affectedAccounts = await query(
    'SELECT DISTINCT accountId FROM ledger WHERE referenceType IN ("Sales", "Payment") AND referenceId = ?',
    [id]
  );

  await execute('DELETE FROM ledger WHERE referenceId = ?', [id]);

  // 3. Recalculate all affected accounts
  for (const acc of affectedAccounts) {
    await recalculateLedgerBalances(acc.accountId);
  }

  if (clientId) {
    const client = await queryRow('SELECT accountId FROM clients WHERE id = ?', [
      clientId,
    ]);
    if (client?.accountId) {
      await recalculateLedgerBalances(client.accountId);
    }
  }
};

export const createSales = async (saleData = {}) => {
  let billNo = saleData.billNo;
  if (!billNo) {
    billNo = await generateSalesBillNo();
  }

  const isMulti = saleData.isMultiProduct ? 1 : 0;
  const multipleProductsStr =
    typeof saleData.multipleProducts === 'string'
      ? saleData.multipleProducts
      : JSON.stringify(saleData.multipleProducts || []);

  const totalAmount = Number(saleData.totalAmountWithTax || 0);
  const paid = Number(saleData.paidAmount || 0);
  const pending = Math.max(0, totalAmount - paid);

  let status = normalizeStatus(saleData.statusOfTransaction);
  if (paid >= totalAmount && totalAmount > 0) status = 'completed';
  else if (paid > 0) status = 'partial';
  else status = 'pending';

  const res = await execute(
    `INSERT INTO sales (
      clientId, productId, date, quantity, saleAmount, multipleProducts, isMultiProduct,
      paymentMethod, statusOfTransaction, paymentType, pendingAmount, paidAmount, pendingFromOurs,
      taxRate, taxAmount, freightCharges, freightTaxAmount, totalAmountWithTax, totalAmountWithoutTax,
      billNo, methodType, dueDate, description, payments, pageName, discount, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Sales', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      saleData.clientId || null,
      saleData.productId || null,
      toISODate(saleData.date || new Date()),
      Math.max(1, Number(saleData.quantity) || 1),
      Number(saleData.saleAmount) || 0,
      multipleProductsStr,
      isMulti,
      normalizePaymentMethod(saleData.paymentMethod),
      status,
      normalizePaymentType(saleData.paymentType),
      pending,
      paid,
      0,
      Number(saleData.taxRate) || 0,
      Number(saleData.taxAmount) || 0,
      Number(saleData.freightCharges) || 0,
      Number(saleData.freightTaxAmount) || 0,
      totalAmount,
      Number(saleData.totalAmountWithoutTax) || 0,
      billNo,
      'Receipt',
      toISODate(saleData.dueDate),
      saleData.description || '',
      typeof saleData.payments === 'string'
        ? saleData.payments
        : JSON.stringify(saleData.payments || []),
      Number(saleData.discount) || 0,
    ]
  );

  const saleId = res.insertId;

  // Apply stock, double-entry ledger, and client balance effects
  await applySaleEffects(
    {
      ...saleData,
      billNo,
      totalAmountWithTax: totalAmount,
      paidAmount: paid,
      isMultiProduct: isMulti,
      multipleProducts: multipleProductsStr,
    },
    saleId
  );

  await logAction({
    actionType: 'CREATE',
    module: 'Sales',
    entityId: saleId,
    entityName: `Bill ${billNo}`,
    title: `Sale Recorded: ${billNo}`,
    details: `Total: ₹${totalAmount}, Paid: ₹${paid}, Status: ${status}`,
    amount: totalAmount,
    targetRoute: '/sales',
  });

  return { success: true, insertId: saleId, billNo };
};

export const updateSales = async ({ id, ...data }) => {
  const oldSale = await getSalesById(id);
  if (!oldSale) throw new Error(`Sale with ID ${id} not found`);

  // Rollback old effects first
  await rollbackSaleEffects(oldSale);

  const totalAmount = Number(data.totalAmountWithTax || oldSale.totalAmountWithTax);
  const paid = Number(data.paidAmount !== undefined ? data.paidAmount : oldSale.paidAmount);
  const pending = Math.max(0, totalAmount - paid);

  let status = normalizeStatus(data.statusOfTransaction || oldSale.statusOfTransaction);
  if (paid >= totalAmount && totalAmount > 0) status = 'completed';
  else if (paid > 0) status = 'partial';
  else status = 'pending';

  const isMulti = data.isMultiProduct !== undefined ? (data.isMultiProduct ? 1 : 0) : oldSale.isMultiProduct;
  const multipleProductsStr =
    typeof data.multipleProducts === 'string'
      ? data.multipleProducts
      : JSON.stringify(data.multipleProducts || oldSale.multipleProducts || []);

  await execute(
    `UPDATE sales SET
      clientId = ?, productId = ?, date = ?, quantity = ?, saleAmount = ?, multipleProducts = ?, isMultiProduct = ?,
      paymentMethod = ?, statusOfTransaction = ?, paymentType = ?, pendingAmount = ?, paidAmount = ?,
      taxRate = ?, taxAmount = ?, freightCharges = ?, totalAmountWithTax = ?, totalAmountWithoutTax = ?,
      billNo = ?, dueDate = ?, description = ?, payments = ?, discount = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      data.clientId || oldSale.clientId,
      data.productId || oldSale.productId,
      toISODate(data.date || oldSale.date),
      Number(data.quantity) || oldSale.quantity,
      Number(data.saleAmount) || oldSale.saleAmount,
      multipleProductsStr,
      isMulti,
      normalizePaymentMethod(data.paymentMethod || oldSale.paymentMethod),
      status,
      normalizePaymentType(data.paymentType || oldSale.paymentType),
      pending,
      paid,
      Number(data.taxRate) || oldSale.taxRate,
      Number(data.taxAmount) || oldSale.taxAmount,
      Number(data.freightCharges) || oldSale.freightCharges,
      totalAmount,
      Number(data.totalAmountWithoutTax) || oldSale.totalAmountWithoutTax,
      data.billNo || oldSale.billNo,
      toISODate(data.dueDate || oldSale.dueDate),
      data.description ?? oldSale.description,
      typeof data.payments === 'string'
        ? data.payments
        : JSON.stringify(data.payments || oldSale.payments || []),
      Number(data.discount) || oldSale.discount || 0,
      id,
    ]
  );

  // Re-apply new effects
  await applySaleEffects(
    {
      ...oldSale,
      ...data,
      totalAmountWithTax: totalAmount,
      paidAmount: paid,
      isMultiProduct: isMulti,
      multipleProducts: multipleProductsStr,
    },
    id
  );

  await logAction({
    actionType: 'UPDATE',
    module: 'Sales',
    entityId: id,
    entityName: `Bill ${data.billNo || oldSale.billNo}`,
    title: `Sale Updated: ${data.billNo || oldSale.billNo}`,
    details: `Updated sale details. New Total: ₹${totalAmount}`,
    amount: totalAmount,
    targetRoute: '/sales',
  });

  return { success: true };
};

export const deleteSales = async (id) => {
  const sale = await getSalesById(id);
  if (!sale) return { success: false, message: 'Sale not found' };

  await rollbackSaleEffects(sale);
  await execute('DELETE FROM sales WHERE id = ?', [id]);

  await logAction({
    actionType: 'DELETE',
    module: 'Sales',
    entityId: id,
    entityName: `Bill ${sale.billNo}`,
    title: `Sale Deleted: ${sale.billNo}`,
    details: `Deleted sale record for Bill ${sale.billNo}`,
    amount: sale.totalAmountWithTax,
    targetRoute: '/sales',
  });

  return { success: true };
};
