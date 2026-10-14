import { execute, query, queryRow } from '../db';
import {
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
import { generatePurchaseBillNo } from './billUtils';

export const getAllPurchases = async () => {
  return query(`
    SELECT p.*, c.clientName, pr.productName
    FROM purchases p
    LEFT JOIN clients c ON p.clientId = c.id
    LEFT JOIN products pr ON p.productId = pr.id
    ORDER BY p.createdAt DESC
  `);
};

export const getPurchaseById = async (id) => {
  return queryRow(
    `SELECT p.*, c.clientName, pr.productName
     FROM purchases p
     LEFT JOIN clients c ON p.clientId = c.id
     LEFT JOIN products pr ON p.productId = pr.id
     WHERE p.id = ?`,
    [id]
  );
};

export const applyPurchaseEffects = async (purchase, purchaseId) => {
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
  } = purchase;

  const total = Number(totalAmountWithTax || 0);
  const paid = Number(paidAmount || 0);

  // 1. STOCK INCREASE (Purchases bring inventory in)
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

  // 2. CLIENT (SUPPLIER/CREDITOR) ACCOUNT CHECK
  const client = await queryRow('SELECT * FROM clients WHERE id = ?', [clientId]);
  if (!client?.accountId) {
    throw new Error('Supplier account missing for double-entry ledger');
  }

  const clientAccount = await queryRow('SELECT * FROM accounts WHERE id = ?', [
    client.accountId,
  ]);

  // Accrual Entry 1: Credit Supplier Account (Creditor / Liability increases)
  await execute(
    `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
     VALUES (?, ?, 'credit', ?, 0, 'Purchase', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
    [
      clientAccount.id,
      clientId,
      total,
      purchaseId,
      `Purchase Bill ${billNo || '-'} from ${client.clientName}`,
      date || null,
    ]
  );

  // Accrual Entry 2: Debit Purchase Expenses nominal account
  const purchaseAcc = await getNominalAccount('Purchase Expenses', 'Purchase');
  await execute(
    `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
     VALUES (?, null, 'debit', ?, 0, 'Purchase', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
    [
      purchaseAcc.id,
      Number(totalAmountWithoutTax || 0) + Number(freightCharges || 0),
      purchaseId,
      `Purchase Expense for Bill ${billNo || '-'} from ${client.clientName}`,
      date || null,
    ]
  );

  // Accrual Entry 3: Debit GST Tax nominal account (Tax Input Credit)
  let taxSum = Number(taxAmount || 0);
  if (taxSum > 0) {
    const taxAcc = await getNominalAccount('GST Tax Account', 'Tax');
    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
       VALUES (?, null, 'debit', ?, 0, 'Purchase', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [taxAcc.id, taxSum, purchaseId, `GST Input Tax on Bill ${billNo || '-'}`, date || null]
    );
    await recalculateLedgerBalances(taxAcc.id);
  }

  await recalculateLedgerBalances(purchaseAcc.id);

  // 3. IMMEDIATE PAYMENTS POSTING
  if (paid > 0) {
    let parsedPayments =
      typeof payments === 'string' ? JSON.parse(payments || '[]') : payments || [];
    if (!Array.isArray(parsedPayments) || parsedPayments.length === 0) {
      parsedPayments = [
        {
          method: purchase.paymentMethod || 'bank',
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

      // Debit Supplier (reducing liability)
      await execute(
        `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
         VALUES (?, ?, 'debit', ?, 0, 'Payment', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [
          clientAccount.id,
          clientId,
          splitAmount,
          purchaseId,
          `Payment to ${client.clientName} for Bill ${billNo || '-'}`,
          date || null,
        ]
      );

      // Credit Cash/Bank (reducing asset)
      await execute(
        `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
         VALUES (?, null, 'credit', ?, 0, 'Payment', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [
          accountToUse.id,
          splitAmount,
          purchaseId,
          `Payment to ${client.clientName} (Bill ${billNo || '-'})`,
          date || null,
        ]
      );

      await recalculateLedgerBalances(accountToUse.id);
    }
  }

  // Recalculate supplier account balance
  await recalculateLedgerBalances(clientAccount.id);
};

export const rollbackPurchaseEffects = async (oldPurchase) => {
  const { id, clientId, productId, quantity, isMultiProduct, multipleProducts } =
    oldPurchase;

  // 1. Stock rollback (reduce stock that was brought in)
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

  // 2. Delete ledger entries created by this purchase
  const affectedAccounts = await query(
    'SELECT DISTINCT accountId FROM ledger WHERE referenceType IN ("Purchase", "Payment") AND referenceId = ?',
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

export const createPurchase = async (purchaseData = {}) => {
  let billNo = purchaseData.billNo;
  if (!billNo) {
    billNo = await generatePurchaseBillNo();
  }

  const isMulti = purchaseData.isMultiProduct ? 1 : 0;
  const multipleProductsStr =
    typeof purchaseData.multipleProducts === 'string'
      ? purchaseData.multipleProducts
      : JSON.stringify(purchaseData.multipleProducts || []);

  const totalAmount = Number(purchaseData.totalAmountWithTax || 0);
  const paid = Number(purchaseData.paidAmount || 0);
  const pending = Math.max(0, totalAmount - paid);

  let status = normalizeStatus(purchaseData.statusOfTransaction);
  if (paid >= totalAmount && totalAmount > 0) status = 'completed';
  else if (paid > 0) status = 'partial';
  else status = 'pending';

  const res = await execute(
    `INSERT INTO purchases (
      clientId, productId, date, quantity, purchaseAmount, multipleProducts, isMultiProduct,
      paymentMethod, statusOfTransaction, paymentType, pendingAmount, paidAmount, pendingFromOurs,
      taxRate, taxAmount, freightCharges, freightTaxAmount, totalAmountWithTax, totalAmountWithoutTax,
      billNo, methodType, dueDate, description, payments, pageName, discount, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Purchase', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      purchaseData.clientId || null,
      purchaseData.productId || null,
      toISODate(purchaseData.date || new Date()),
      Math.max(1, Number(purchaseData.quantity) || 1),
      Number(purchaseData.purchaseAmount) || 0,
      multipleProductsStr,
      isMulti,
      normalizePaymentMethod(purchaseData.paymentMethod),
      status,
      normalizePaymentType(purchaseData.paymentType),
      pending,
      paid,
      0,
      Number(purchaseData.taxRate) || 0,
      Number(purchaseData.taxAmount) || 0,
      Number(purchaseData.freightCharges) || 0,
      Number(purchaseData.freightTaxAmount) || 0,
      totalAmount,
      Number(purchaseData.totalAmountWithoutTax) || 0,
      billNo,
      'Payment',
      toISODate(purchaseData.dueDate),
      purchaseData.description || '',
      typeof purchaseData.payments === 'string'
        ? purchaseData.payments
        : JSON.stringify(purchaseData.payments || []),
      Number(purchaseData.discount) || 0,
    ]
  );

  const purchaseId = res.insertId;

  // Apply stock, double-entry ledger, and supplier balance effects
  await applyPurchaseEffects(
    {
      ...purchaseData,
      billNo,
      totalAmountWithTax: totalAmount,
      paidAmount: paid,
      isMultiProduct: isMulti,
      multipleProducts: multipleProductsStr,
    },
    purchaseId
  );

  await logAction({
    actionType: 'CREATE',
    module: 'Purchase',
    entityId: purchaseId,
    entityName: `Bill ${billNo}`,
    title: `Purchase Recorded: ${billNo}`,
    details: `Total: ₹${totalAmount}, Paid: ₹${paid}, Status: ${status}`,
    amount: totalAmount,
    targetRoute: '/purchase',
  });

  return { success: true, insertId: purchaseId, billNo };
};

export const updatePurchase = async ({ id, ...data }) => {
  const oldPurchase = await getPurchaseById(id);
  if (!oldPurchase) throw new Error(`Purchase with ID ${id} not found`);

  // Rollback old effects first
  await rollbackPurchaseEffects(oldPurchase);

  const totalAmount = Number(data.totalAmountWithTax || oldPurchase.totalAmountWithTax);
  const paid = Number(data.paidAmount !== undefined ? data.paidAmount : oldPurchase.paidAmount);
  const pending = Math.max(0, totalAmount - paid);

  let status = normalizeStatus(data.statusOfTransaction || oldPurchase.statusOfTransaction);
  if (paid >= totalAmount && totalAmount > 0) status = 'completed';
  else if (paid > 0) status = 'partial';
  else status = 'pending';

  const isMulti = data.isMultiProduct !== undefined ? (data.isMultiProduct ? 1 : 0) : oldPurchase.isMultiProduct;
  const multipleProductsStr =
    typeof data.multipleProducts === 'string'
      ? data.multipleProducts
      : JSON.stringify(data.multipleProducts || oldPurchase.multipleProducts || []);

  await execute(
    `UPDATE purchases SET
      clientId = ?, productId = ?, date = ?, quantity = ?, purchaseAmount = ?, multipleProducts = ?, isMultiProduct = ?,
      paymentMethod = ?, statusOfTransaction = ?, paymentType = ?, pendingAmount = ?, paidAmount = ?,
      taxRate = ?, taxAmount = ?, freightCharges = ?, totalAmountWithTax = ?, totalAmountWithoutTax = ?,
      billNo = ?, dueDate = ?, description = ?, payments = ?, discount = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      data.clientId || oldPurchase.clientId,
      data.productId || oldPurchase.productId,
      toISODate(data.date || oldPurchase.date),
      Number(data.quantity) || oldPurchase.quantity,
      Number(data.purchaseAmount) || oldPurchase.purchaseAmount,
      multipleProductsStr,
      isMulti,
      normalizePaymentMethod(data.paymentMethod || oldPurchase.paymentMethod),
      status,
      normalizePaymentType(data.paymentType || oldPurchase.paymentType),
      pending,
      paid,
      Number(data.taxRate) || oldPurchase.taxRate,
      Number(data.taxAmount) || oldPurchase.taxAmount,
      Number(data.freightCharges) || oldPurchase.freightCharges,
      totalAmount,
      Number(data.totalAmountWithoutTax) || oldPurchase.totalAmountWithoutTax,
      data.billNo || oldPurchase.billNo,
      toISODate(data.dueDate || oldPurchase.dueDate),
      data.description ?? oldPurchase.description,
      typeof data.payments === 'string'
        ? data.payments
        : JSON.stringify(data.payments || oldPurchase.payments || []),
      Number(data.discount) || oldPurchase.discount || 0,
      id,
    ]
  );

  // Re-apply new effects
  await applyPurchaseEffects(
    {
      ...oldPurchase,
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
    module: 'Purchase',
    entityId: id,
    entityName: `Bill ${data.billNo || oldPurchase.billNo}`,
    title: `Purchase Updated: ${data.billNo || oldPurchase.billNo}`,
    details: `Updated purchase details. New Total: ₹${totalAmount}`,
    amount: totalAmount,
    targetRoute: '/purchase',
  });

  return { success: true };
};

export const deletePurchase = async (id) => {
  const purchase = await getPurchaseById(id);
  if (!purchase) return { success: false, message: 'Purchase not found' };

  await rollbackPurchaseEffects(purchase);
  await execute('DELETE FROM purchases WHERE id = ?', [id]);

  await logAction({
    actionType: 'DELETE',
    module: 'Purchase',
    entityId: id,
    entityName: `Bill ${purchase.billNo}`,
    title: `Purchase Deleted: ${purchase.billNo}`,
    details: `Deleted purchase record for Bill ${purchase.billNo}`,
    amount: purchase.totalAmountWithTax,
    targetRoute: '/purchase',
  });

  return { success: true };
};
