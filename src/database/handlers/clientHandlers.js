import { execute, query, queryRow } from '../db';
import { logAction } from './helpers';
import { recalculateLedgerBalances } from './accountHandlers';

export const getFormattedClient = async (clientId) => {
  const client = await queryRow(
    `SELECT c.*, 
            a.openingBalance, 
            a.openingBalanceType, 
            a.closingBalance, 
            a.closingBalanceType
     FROM clients c
     LEFT JOIN accounts a ON c.accountId = a.id
     WHERE c.id = ?`,
    [clientId]
  );
  if (!client) return null;

  if (client.closingBalance !== null && client.closingBalance !== undefined) {
    const closing = Number(client.closingBalance || 0);
    const closingType = client.closingBalanceType || 'DR';
    client.pendingAmount = closingType === 'DR' ? closing : 0;
    client.pendingFromOurs = closingType === 'CR' ? closing : 0;
  }

  const salesPaid = await queryRow(
    'SELECT COALESCE(SUM(paidAmount), 0) AS total FROM sales WHERE clientId = ?',
    [clientId]
  );
  const purchasePaid = await queryRow(
    'SELECT COALESCE(SUM(paidAmount), 0) AS total FROM purchases WHERE clientId = ?',
    [clientId]
  );

  client.paidAmount = Number(salesPaid?.total || 0) + Number(purchasePaid?.total || 0);

  return client;
};

export const getAllClients = async () => {
  const clients = await query(
    `SELECT c.*, 
            a.openingBalance, 
            a.openingBalanceType, 
            a.closingBalance, 
            a.closingBalanceType
     FROM clients c
     LEFT JOIN accounts a ON c.accountId = a.id
     ORDER BY c.createdAt DESC`
  );

  for (const client of clients) {
    if (client.closingBalance !== null && client.closingBalance !== undefined) {
      const closing = Number(client.closingBalance || 0);
      const closingType = client.closingBalanceType || 'DR';
      client.pendingAmount = closingType === 'DR' ? closing : 0;
      client.pendingFromOurs = closingType === 'CR' ? closing : 0;
    }

    const salesPaid = await queryRow(
      'SELECT COALESCE(SUM(paidAmount), 0) AS total FROM sales WHERE clientId = ?',
      [client.id]
    );
    const purchasePaid = await queryRow(
      'SELECT COALESCE(SUM(paidAmount), 0) AS total FROM purchases WHERE clientId = ?',
      [client.id]
    );

    client.paidAmount = Number(salesPaid?.total || 0) + Number(purchasePaid?.total || 0);
  }

  return clients;
};

export const createClient = async (client = {}) => {
  const {
    clientName = '',
    phoneNo = '',
    gstNo = '',
    address = '',
    accountType = 'Debtor',
    openingBalance = 0,
    pageName = 'Client',
    isEmployee = false,
    salary = 0,
    salaryHistory = [],
    pendingAmount = 0,
    paidAmount = 0,
    pendingFromOurs = 0,
    createdAt = new Date().toISOString(),
  } = client;

  // Insert Client
  const clientRes = await execute(
    `INSERT INTO clients 
     (clientName, phoneNo, gstNo, address, accountType, pageName, isEmployee, salary, salaryHistory, pendingAmount, paidAmount, pendingFromOurs, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      clientName || '',
      phoneNo || '',
      gstNo || '',
      address || '',
      accountType || 'Debtor',
      pageName || 'Client',
      isEmployee ? 1 : 0,
      Number(salary) || 0,
      JSON.stringify(salaryHistory || []),
      Number(pendingAmount) || 0,
      Number(paidAmount) || 0,
      Number(pendingFromOurs) || 0,
      createdAt,
    ]
  );

  const clientId = clientRes.insertId;
  const accountNumber = `ACC-${Date.now()}`;

  const isCreditor = accountType === 'Creditor';
  let openingBalanceType = 'DR';
  if (Number(pendingAmount || 0) > 0 || Number(pendingFromOurs || 0) > 0) {
    if (isCreditor) {
      openingBalanceType =
        Number(pendingFromOurs || 0) >= Number(pendingAmount || 0) ? 'CR' : 'DR';
    } else {
      openingBalanceType =
        Number(pendingAmount || 0) >= Number(pendingFromOurs || 0) ? 'DR' : 'CR';
    }
  } else if (client.openingBalanceType) {
    openingBalanceType = client.openingBalanceType;
  } else {
    openingBalanceType = isCreditor ? 'CR' : 'DR';
  }

  const pendingNet = Number(pendingAmount || 0) - Number(pendingFromOurs || 0);
  const openingBalanceNet = pendingNet !== 0 ? pendingNet : Number(openingBalance || 0);
  const openingBalanceAbs = Math.abs(openingBalanceNet);

  // Insert Account linked to Client
  const accountRes = await execute(
    `INSERT INTO accounts
     (clientId, accountName, openingBalance, openingBalanceType, closingBalance, closingBalanceType, accountNumber, accountType, accounterType, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Client', 'active')`,
    [
      clientId,
      clientName || '',
      openingBalanceAbs,
      openingBalanceType,
      openingBalanceAbs,
      openingBalanceType,
      accountNumber,
      accountType || 'Debtor',
    ]
  );

  const accountId = accountRes.insertId;

  // Insert Ledger Opening Entry
  await execute(
    `INSERT INTO ledger
     (accountId, clientId, entryType, amount, balanceAfter, balanceType, referenceType, narration)
     VALUES (?, ?, 'opening', ?, ?, ?, 'Opening', 'Opening Balance')`,
    [accountId, clientId, openingBalanceAbs, openingBalanceAbs, openingBalanceType]
  );

  // Update Client with Account Info
  await execute('UPDATE clients SET accountId = ?, accountNumber = ? WHERE id = ?', [
    accountId,
    accountNumber,
    clientId,
  ]);

  await logAction({
    actionType: 'CREATE',
    module: 'Client',
    entityId: clientId,
    entityName: clientName || '',
    title: `New Client Created: ${clientName || 'Client'}`,
    details: `Created client "${clientName}" (${accountType || 'Client'}). Phone: ${phoneNo || '-'}, Address: ${address || '-'}`,
    amount: openingBalanceAbs,
    newBalance: openingBalanceAbs,
    balanceType: openingBalanceType,
    targetRoute: '/clients',
    routeParams: { clientId },
  });

  return {
    success: true,
    message: 'Client created successfully',
    clientId,
    accountId,
    accountNumber,
  };
};

export const updateClient = async (client) => {
  const oldClient = await queryRow('SELECT * FROM clients WHERE id = ?', [client.id]);
  if (!oldClient) throw new Error('Client not found');

  const salaryHistoryStr =
    typeof client.salaryHistory === 'string'
      ? client.salaryHistory
      : JSON.stringify(client.salaryHistory || []);

  await execute(
    `UPDATE clients
     SET clientName = ?, phoneNo = ?, address = ?, pendingAmount = ?, paidAmount = ?, pendingFromOurs = ?, 
         accountType = ?, gstNo = ?, pageName = ?, isEmployee = ?, salary = ?, salaryHistory = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      client.clientName ?? '',
      client.phoneNo ?? '',
      client.address ?? '',
      Number(client.pendingAmount) || 0,
      Number(client.paidAmount) || 0,
      Number(client.pendingFromOurs) || 0,
      client.accountType ?? '',
      client.gstNo ?? '',
      client.pageName ?? 'Client',
      client.isEmployee ? 1 : 0,
      Number(client.salary) || 0,
      salaryHistoryStr,
      client.id,
    ]
  );

  // Sync account name if client name changed
  if (oldClient.clientName !== client.clientName && oldClient.accountId) {
    await execute(
      'UPDATE accounts SET accountName = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [client.clientName, oldClient.accountId]
    );
  }

  // Update opening balance if changed
  if (oldClient.accountId) {
    const openingEntry = await queryRow(
      "SELECT * FROM ledger WHERE accountId = ? AND referenceType = 'Opening'",
      [oldClient.accountId]
    );

    if (openingEntry) {
      const oldOpening =
        Number(oldClient.pendingAmount || 0) - Number(oldClient.pendingFromOurs || 0);
      const newOpening =
        Number(client.pendingAmount || 0) - Number(client.pendingFromOurs || 0);

      if (oldOpening !== newOpening) {
        const isCreditor = client.accountType === 'Creditor';
        const newOpeningType = isCreditor
          ? newOpening > 0
            ? 'CR'
            : newOpening < 0
            ? 'DR'
            : 'CR'
          : newOpening > 0
          ? 'DR'
          : newOpening < 0
          ? 'CR'
          : 'DR';
        const newOpeningAbs = Math.abs(newOpening);

        await execute(
          'UPDATE ledger SET amount = ?, balanceAfter = ?, balanceType = ?, entryType = ? WHERE id = ?',
          [newOpeningAbs, newOpeningAbs, newOpeningType, 'opening', openingEntry.id]
        );

        await execute(
          'UPDATE accounts SET openingBalance = ?, openingBalanceType = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
          [newOpeningAbs, newOpeningType, oldClient.accountId]
        );

        await recalculateLedgerBalances(oldClient.accountId);
      }
    }
  }

  await logAction({
    actionType: 'UPDATE',
    module: 'Client',
    entityId: client.id,
    entityName: client.clientName || oldClient.clientName,
    title: `Client Information Updated: ${client.clientName || oldClient.clientName}`,
    details: `Updated details for ${client.clientName || oldClient.clientName}. Phone: ${client.phoneNo || '-'}, Account Type: ${client.accountType || '-'}`,
    targetRoute: '/clients',
    routeParams: { clientId: client.id },
  });

  return getFormattedClient(client.id);
};

export const deleteClient = async (id) => {
  const client = await queryRow('SELECT * FROM clients WHERE id = ?', [id]);
  if (!client) return { success: false, message: 'Client not found' };

  if (client.accountId) {
    await execute('DELETE FROM ledger WHERE accountId = ?', [client.accountId]);
    await execute('DELETE FROM accounts WHERE id = ?', [client.accountId]);
  }

  await execute('DELETE FROM clients WHERE id = ?', [id]);

  await logAction({
    actionType: 'DELETE',
    module: 'Client',
    entityId: id,
    entityName: client.clientName,
    title: `Client Account Deleted: ${client.clientName}`,
    details: `Permanently deleted client account "${client.clientName}" and associated ledgers`,
    targetRoute: '/clients',
  });

  return { success: true, message: 'Client deleted successfully' };
};

export const getClientById = async (id) => {
  return getFormattedClient(id);
};

export const getPaginatedClients = async ({ page = 1, limit = 20, search = '' }) => {
  const offset = (page - 1) * limit;
  let sql = `SELECT c.*, a.closingBalance, a.closingBalanceType
             FROM clients c
             LEFT JOIN accounts a ON c.accountId = a.id`;
  const params = [];

  if (search?.trim()) {
    sql += ' WHERE c.clientName LIKE ? OR c.phoneNo LIKE ? OR c.gstNo LIKE ?';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  sql += ' ORDER BY c.createdAt DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const clients = await query(sql, params);
  for (const client of clients) {
    if (client.closingBalance !== null && client.closingBalance !== undefined) {
      const closing = Number(client.closingBalance || 0);
      const closingType = client.closingBalanceType || 'DR';
      client.pendingAmount = closingType === 'DR' ? closing : 0;
      client.pendingFromOurs = closingType === 'CR' ? closing : 0;
    }
  }

  return clients;
};
