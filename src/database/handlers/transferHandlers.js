import { execute, query, queryRow } from '../db';
import { recalculateLedgerBalances } from './accountHandlers';
import { logAction } from './helpers';

export const transferAmount = async ({
  fromAccountId,
  toAccountId,
  amount,
  narration = 'Account Transfer',
  date = null,
}) => {
  const amt = Number(amount);
  if (!fromAccountId || !toAccountId || !amt || amt <= 0) {
    return { success: false, error: 'Invalid transfer details' };
  }

  if (fromAccountId === toAccountId) {
    return { success: false, error: 'Source and destination accounts must be different' };
  }

  const fromAccount = await queryRow('SELECT * FROM accounts WHERE id = ?', [fromAccountId]);
  const toAccount = await queryRow('SELECT * FROM accounts WHERE id = ?', [toAccountId]);

  if (!fromAccount || !toAccount) {
    return { success: false, error: 'Account not found' };
  }

  const transferId = `TR-${Date.now()}`;

  // Credit Outflow Entry on source account
  await execute(
    `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
     VALUES (?, ?, 'credit', ?, 0, 'Transfer', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
    [
      fromAccountId,
      fromAccount.clientId || null,
      amt,
      transferId,
      narration || `Transfer to ${toAccount.accountName}`,
      date,
    ]
  );

  // Debit Inflow Entry on destination account
  await execute(
    `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
     VALUES (?, ?, 'debit', ?, 0, 'Transfer', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
    [
      toAccountId,
      toAccount.clientId || null,
      amt,
      transferId,
      narration || `Transfer from ${fromAccount.accountName}`,
      date,
    ]
  );

  const newFromBal = await recalculateLedgerBalances(fromAccountId);
  const newToBal = await recalculateLedgerBalances(toAccountId);

  await logAction({
    actionType: 'TRANSFER',
    module: 'Bank Transfer',
    title: `Fund Transfer: ₹${amt}`,
    details: `Transferred ₹${amt} from "${fromAccount.accountName}" to "${toAccount.accountName}"`,
    fromSource: fromAccount.accountName,
    toDestination: toAccount.accountName,
    amount: amt,
    targetRoute: '/transferAmount',
  });

  return {
    success: true,
    transferId,
    newFromBalance: newFromBal,
    newToBalance: newToBal,
  };
};

export const addManualEntryWithClient = async ({
  bankAccountId,
  clientId,
  entryType, // 'debit' | 'credit'
  amount,
  narration = '',
  date = null,
}) => {
  const bankAcc = await queryRow('SELECT * FROM accounts WHERE id = ?', [bankAccountId]);
  if (!bankAcc) throw new Error('Bank/Cash Account not found');

  const client = await queryRow('SELECT * FROM clients WHERE id = ?', [clientId]);
  if (!client || !client.accountId) throw new Error('Client or linked account not found');

  const clientAcc = await queryRow('SELECT * FROM accounts WHERE id = ?', [client.accountId]);
  const amt = Number(amount);
  if (amt <= 0) throw new Error('Amount must be positive');

  const manualRefId = `MANUAL-${Date.now()}`;

  if (entryType === 'debit') {
    // Debit Client, Credit Bank/Cash
    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
       VALUES (?, ?, 'debit', ?, 0, 'Adjustment(Manual)', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [clientAcc.id, clientId, amt, manualRefId, narration || 'Manual Client Debit', date]
    );

    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
       VALUES (?, null, 'credit', ?, 0, 'BankAdjustment(Manual)', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [bankAcc.id, amt, manualRefId, narration || `Adjustment for ${client.clientName}`, date]
    );
  } else {
    // Credit Client, Debit Bank/Cash
    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
       VALUES (?, ?, 'credit', ?, 0, 'Adjustment(Manual)', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [clientAcc.id, clientId, amt, manualRefId, narration || 'Manual Client Credit', date]
    );

    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
       VALUES (?, null, 'debit', ?, 0, 'BankAdjustment(Manual)', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [bankAcc.id, amt, manualRefId, narration || `Payment from ${client.clientName}`, date]
    );
  }

  await recalculateLedgerBalances(clientAcc.id);
  await recalculateLedgerBalances(bankAcc.id);

  return { success: true, referenceId: manualRefId };
};

export const addPaymentAgainstInvoice = async ({
  bankAccountId,
  clientId,
  invoiceId,
  invoiceType = 'Sales', // 'Sales' | 'Purchase'
  amount,
  narration = '',
  date = null,
}) => {
  const amt = Number(amount);
  if (amt <= 0) throw new Error('Payment amount must be greater than zero');

  const bankAcc = await queryRow('SELECT * FROM accounts WHERE id = ?', [bankAccountId]);
  if (!bankAcc) throw new Error('Bank/Cash account not found');

  const client = await queryRow('SELECT * FROM clients WHERE id = ?', [clientId]);
  if (!client?.accountId) throw new Error('Client account not found');

  const clientAcc = await queryRow('SELECT * FROM accounts WHERE id = ?', [client.accountId]);

  const tableName = invoiceType === 'Sales' ? 'sales' : 'purchases';
  let targetInvoices = [];

  if (invoiceId) {
    const inv = await queryRow(`SELECT * FROM ${tableName} WHERE id = ?`, [invoiceId]);
    if (inv) targetInvoices.push(inv);
  } else {
    targetInvoices = await query(
      `SELECT * FROM ${tableName} WHERE clientId = ? AND pendingAmount > 0 ORDER BY date ASC, id ASC`,
      [clientId]
    );
  }

  if (targetInvoices.length === 0) {
    throw new Error('No pending invoices found for payment allocation');
  }

  let remaining = amt;
  const payRef = `PMT-${Date.now()}`;

  for (const inv of targetInvoices) {
    if (remaining <= 0) break;

    const pending = Number(inv.pendingAmount || 0);
    const alloc = Math.min(remaining, pending);

    const newPaid = Number(inv.paidAmount || 0) + alloc;
    const newPending = Math.max(0, pending - alloc);
    const newStatus = newPending <= 0 ? 'completed' : 'partial';

    await execute(
      `UPDATE ${tableName} SET paidAmount = ?, pendingAmount = ?, statusOfTransaction = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [newPaid, newPending, newStatus, inv.id]
    );

    remaining -= alloc;
  }

  if (invoiceType === 'Sales') {
    // Sales receipt: Debit Bank/Cash, Credit Client
    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
       VALUES (?, null, 'debit', ?, 0, 'Payment', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [bankAcc.id, amt, payRef, narration || `Payment received from ${client.clientName}`, date]
    );

    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
       VALUES (?, ?, 'credit', ?, 0, 'Payment', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [clientAcc.id, clientId, amt, payRef, narration || `Payment against invoice(s)`, date]
    );
  } else {
    // Purchase payment: Debit Supplier, Credit Bank/Cash
    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
       VALUES (?, ?, 'debit', ?, 0, 'Payment', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [clientAcc.id, clientId, amt, payRef, narration || `Payment to supplier ${client.clientName}`, date]
    );

    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
       VALUES (?, null, 'credit', ?, 0, 'Payment', ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
      [bankAcc.id, amt, payRef, narration || `Payment against purchase bill(s)`, date]
    );
  }

  await recalculateLedgerBalances(bankAcc.id);
  await recalculateLedgerBalances(clientAcc.id);

  return { success: true, paymentRef: payRef, allocatedAmount: amt - remaining };
};
