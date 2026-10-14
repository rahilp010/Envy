import { execute, query, queryRow } from '../db';
import { recalculateLedgerBalances } from './accountHandlers';
import { logAction } from './helpers';

export const addLedgerEntry = async (data) => {
  const {
    accountId,
    clientId = null,
    entryType, // 'debit' | 'credit' | 'opening'
    amount,
    referenceType = 'Adjustment(Manual)',
    referenceId = null,
    narration = '',
    date = null,
  } = data;

  const amt = Math.abs(Number(amount) || 0);

  const res = await execute(
    `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, referenceType, referenceId, narration, date)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
    [
      accountId,
      clientId,
      entryType,
      amt,
      referenceType,
      referenceId,
      narration,
      date,
    ]
  );

  const newBalance = await recalculateLedgerBalances(accountId);

  await logAction({
    actionType: 'CREATE',
    module: 'Ledger',
    entityId: res.insertId,
    title: `Ledger Entry Added: ${entryType?.toUpperCase()} ₹${amt}`,
    details: `${narration || 'Manual Ledger adjustment'} (${referenceType})`,
    amount: amt,
    newBalance,
    targetRoute: '/ledger',
  });

  return { success: true, insertId: res.insertId, newBalance };
};

export const enrichLedgerEntries = async (entries = []) => {
  if (!entries || entries.length === 0) return [];

  const clientIds = [...new Set(entries.map((e) => e.clientId).filter(Boolean))];
  const clientMap = new Map();
  if (clientIds.length > 0) {
    const clients = await query(
      `SELECT id, clientName, accountType FROM clients WHERE id IN (${clientIds.join(',')})`
    );
    clients.forEach((c) => clientMap.set(c.id, c));
  }

  const accountIds = [...new Set(entries.map((e) => e.accountId).filter(Boolean))];
  const accountMap = new Map();
  if (accountIds.length > 0) {
    const accounts = await query(
      `SELECT id, accountName, accountType FROM accounts WHERE id IN (${accountIds.join(',')})`
    );
    accounts.forEach((a) => accountMap.set(a.id, a));
  }

  return entries.map((e) => ({
    ...e,
    client: clientMap.get(e.clientId) || null,
    clientName: clientMap.get(e.clientId)?.clientName || '',
    account: accountMap.get(e.accountId) || null,
    accountName: accountMap.get(e.accountId)?.accountName || '',
  }));
};

export const getAccountLedger = async (accountId) => {
  const entries = await query(
    `SELECT * FROM ledger WHERE accountId = ?
     ORDER BY CASE WHEN entryType = 'opening' THEN 0 ELSE 1 END ASC, date(date) ASC, createdAt ASC, id ASC`,
    [accountId]
  );
  return enrichLedgerEntries(entries);
};

export const getClientLedger = async (clientId) => {
  const entries = await query(
    `SELECT * FROM ledger WHERE clientId = ?
     ORDER BY CASE WHEN entryType = 'opening' THEN 0 ELSE 1 END ASC, date(date) ASC, createdAt ASC, id ASC`,
    [clientId]
  );
  return enrichLedgerEntries(entries);
};

export const getAccountLedgerByDate = async ({ accountId, from, to }) => {
  let sql = `SELECT * FROM ledger WHERE accountId = ?`;
  const params = [accountId];

  if (from) {
    sql += ' AND date(date) >= date(?)';
    params.push(from);
  }
  if (to) {
    sql += ' AND date(date) <= date(?)';
    params.push(to);
  }

  sql += ' ORDER BY CASE WHEN entryType = "opening" THEN 0 ELSE 1 END ASC, date(date) ASC, createdAt ASC, id ASC';

  const entries = await query(sql, params);
  return enrichLedgerEntries(entries);
};

export const deleteLedgerEntry = async (id) => {
  const entry = await queryRow('SELECT * FROM ledger WHERE id = ?', [id]);
  if (!entry) return { success: false, message: 'Ledger entry not found' };

  await execute('DELETE FROM ledger WHERE id = ?', [id]);
  await recalculateLedgerBalances(entry.accountId);

  await logAction({
    actionType: 'DELETE',
    module: 'Ledger',
    entityId: id,
    title: `Ledger Entry Deleted`,
    details: `Deleted entry of ₹${entry.amount} (${entry.entryType})`,
    targetRoute: '/ledger',
  });

  return { success: true };
};

export const deleteLedgerEntriesByReference = async (referenceId) => {
  const affected = await query(
    'SELECT DISTINCT accountId FROM ledger WHERE referenceId = ?',
    [referenceId]
  );

  await execute('DELETE FROM ledger WHERE referenceId = ?', [referenceId]);

  for (const row of affected) {
    await recalculateLedgerBalances(row.accountId);
  }

  return true;
};
