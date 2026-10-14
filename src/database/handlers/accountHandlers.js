import { execute, query, queryRow, runTransaction } from '../db';
import { isDebitNormal, logAction } from './helpers';

/**
 * Recalculate and persist running balances for an account's ledger entries with explicit Dr/Cr tracking
 */
export const recalculateLedgerBalances = async (accountId) => {
  const account = await queryRow('SELECT * FROM accounts WHERE id = ?', [accountId]);
  if (!account) return 0;

  const allEntries = await query(
    `SELECT * FROM ledger WHERE accountId = ? 
     ORDER BY CASE WHEN entryType = 'opening' THEN 0 ELSE 1 END ASC, date(date) ASC, createdAt ASC, id ASC`,
    [accountId]
  );

  let runningBalance = Math.abs(account.openingBalance || 0);
  let balanceType = account.openingBalanceType || 'DR';

  if (runningBalance === 0) {
    balanceType = isDebitNormal(account.accountType) ? 'DR' : 'CR';
  }

  for (const e of allEntries) {
    if (e.referenceType === 'Opening' || e.entryType === 'opening') {
      runningBalance = Math.abs(e.amount || 0);
      balanceType = e.balanceType || 'DR';
      await execute('UPDATE ledger SET balanceAfter = ?, balanceType = ? WHERE id = ?', [
        runningBalance,
        balanceType,
        e.id,
      ]);
    } else {
      const amount = Number(e.amount || 0);

      if (e.entryType === 'debit') {
        if (balanceType === 'DR') {
          runningBalance += amount;
        } else {
          if (amount > runningBalance) {
            runningBalance = amount - runningBalance;
            balanceType = 'DR';
          } else {
            runningBalance -= amount;
          }
        }
      } else if (e.entryType === 'credit') {
        if (balanceType === 'CR') {
          runningBalance += amount;
        } else {
          if (amount > runningBalance) {
            runningBalance = amount - runningBalance;
            balanceType = 'CR';
          } else {
            runningBalance -= amount;
          }
        }
      }

      await execute('UPDATE ledger SET balanceAfter = ?, balanceType = ? WHERE id = ?', [
        runningBalance,
        balanceType,
        e.id,
      ]);
    }
  }

  // Update account closing balance
  await execute(
    'UPDATE accounts SET closingBalance = ?, closingBalanceType = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [runningBalance, balanceType, accountId]
  );

  // Sync to client if this account is associated with a client
  if (account.clientId) {
    const pendingAmount = balanceType === 'DR' ? runningBalance : 0;
    const pendingFromOurs = balanceType === 'CR' ? runningBalance : 0;

    await execute(
      'UPDATE clients SET pendingAmount = ?, pendingFromOurs = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [pendingAmount, pendingFromOurs, account.clientId]
    );
  }

  return runningBalance;
};

/**
 * Get or create system nominal account (Sales Revenue, Purchase Expenses, GST Tax Account, etc.)
 */
export const getNominalAccount = async (name, type) => {
  let acc = await queryRow('SELECT * FROM accounts WHERE accountName = ? AND accountType = ?', [
    name,
    type,
  ]);
  if (!acc) {
    const res = await execute(
      `INSERT INTO accounts (accountName, accountType, accounterType, status, openingBalance, openingBalanceType, closingBalance, closingBalanceType)
       VALUES (?, ?, 'Main', 'active', 0, 'DR', 0, 'DR')`,
      [name, type]
    );
    acc = await queryRow('SELECT * FROM accounts WHERE id = ?', [res.insertId]);
  }
  return acc;
};

/**
 * Get or create system bank/cash account
 */
export const getOrCreateSystemAccount = async (paymentMethod) => {
  const type = paymentMethod === 'cash' ? 'Cash' : 'Bank';
  let systemAccount = await queryRow('SELECT * FROM accounts WHERE accountType = ? LIMIT 1', [
    type,
  ]);

  if (!systemAccount) {
    const defaultName = paymentMethod === 'cash' ? 'Cash Account' : 'Bank Account';
    const res = await execute(
      `INSERT INTO accounts (accountName, accountType, openingBalance, closingBalance, accounterType, status)
       VALUES (?, ?, 0, 0, 'Main', 'active')`,
      [defaultName, type]
    );
    systemAccount = await queryRow('SELECT * FROM accounts WHERE id = ?', [res.insertId]);
  }

  return systemAccount;
};

/**
 * Get all accounts
 */
export const getAllAccounts = async () => {
  return query('SELECT * FROM accounts ORDER BY createdAt DESC');
};

/**
 * Create a new account
 */
export const createAccount = async (accountData) => {
  const {
    accountName,
    accountType = 'Bank',
    clientId = null,
    openingBalance = 0,
    closingBalance,
    accounterType = 'Main',
    status = 'active',
  } = accountData;

  if (!accountName?.trim()) {
    return { success: false, message: 'Account name is required' };
  }

  const existing = await queryRow('SELECT id FROM accounts WHERE accountName = ?', [
    accountName.trim(),
  ]);

  if (existing) {
    return { success: false, message: 'Account name already exists' };
  }

  let newAccountType = accountType;
  if (accounterType === 'GPay') {
    newAccountType = 'GPay';
  }

  const explicitClosingBalance = closingBalance !== undefined ? closingBalance : openingBalance;
  const accountBalanceType = Number(openingBalance) >= 0 ? 'DR' : 'CR';

  const res = await execute(
    `INSERT INTO accounts
     (clientId, accountName, accountType, openingBalance, openingBalanceType, closingBalance, closingBalanceType, status, accounterType, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      clientId,
      accountName.trim(),
      newAccountType,
      Number(openingBalance) || 0,
      accountBalanceType,
      Number(explicitClosingBalance) || 0,
      accountBalanceType,
      status,
      accounterType,
    ]
  );

  const accountId = res.insertId;

  // Insert initial opening ledger entry
  if (Number(openingBalance) !== 0) {
    await execute(
      `INSERT INTO ledger (accountId, clientId, entryType, amount, balanceAfter, balanceType, referenceType, narration)
       VALUES (?, ?, 'opening', ?, ?, ?, 'Opening', 'Opening Balance')`,
      [
        accountId,
        clientId,
        Math.abs(Number(openingBalance)),
        Math.abs(Number(openingBalance)),
        accountBalanceType,
      ]
    );
  }

  await logAction({
    actionType: 'CREATE',
    module: 'Bank Account',
    entityId: accountId,
    entityName: accountName.trim(),
    title: `New Account Created: ${accountName.trim()}`,
    details: `Created ${newAccountType} account "${accountName.trim()}". Opening Balance: ₹${openingBalance}`,
    amount: Number(openingBalance),
    newBalance: Number(explicitClosingBalance),
    balanceType: accountBalanceType,
    targetRoute: '/bankManagement',
  });

  return {
    success: true,
    message: `Account "${accountName}" created successfully`,
    data: {
      id: accountId,
      accountName: accountName.trim(),
      accountType: newAccountType,
      openingBalance: Number(openingBalance) || 0,
      openingBalanceType: accountBalanceType,
      closingBalance: Number(explicitClosingBalance) || 0,
      closingBalanceType: accountBalanceType,
      status,
      accounterType,
      pageName: 'Account',
    },
  };
};

/**
 * Update an account
 */
export const updateAccount = async ({ id, ...updates }) => {
  if (!id) {
    return { success: false, message: 'Account ID is required' };
  }

  const current = await queryRow('SELECT * FROM accounts WHERE id = ?', [id]);
  if (!current) {
    return { success: false, message: 'Account not found' };
  }

  const { accountName, accountType, status, openingBalance, accounterType } = updates;

  if (accountName && !accountName.trim()) {
    return { success: false, message: 'Account name cannot be empty' };
  }

  if (accountName) {
    const existing = await queryRow(
      'SELECT id FROM accounts WHERE accountName = ? AND id != ?',
      [accountName.trim(), id]
    );
    if (existing) {
      return { success: false, message: 'Account name already exists' };
    }
  }

  const updatedName = accountName ? accountName.trim() : current.accountName;
  const updatedType = accountType || current.accountType;
  const updatedStatus = status || current.status;
  const updatedAccounterType = accounterType || current.accounterType;
  const updatedOpeningBalance =
    openingBalance !== undefined ? Number(openingBalance) : current.openingBalance;
  const openingType = updatedOpeningBalance >= 0 ? 'DR' : 'CR';

  await execute(
    `UPDATE accounts 
     SET accountName = ?, accountType = ?, status = ?, openingBalance = ?, openingBalanceType = ?, accounterType = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      updatedName,
      updatedType,
      updatedStatus,
      updatedOpeningBalance,
      openingType,
      updatedAccounterType,
      id,
    ]
  );

  // Recalculate ledger balances
  await recalculateLedgerBalances(id);

  return { success: true, message: 'Account updated successfully' };
};

/**
 * Delete an account
 */
export const deleteAccount = async (id) => {
  const account = await queryRow('SELECT * FROM accounts WHERE id = ?', [id]);
  if (!account) return { success: false, message: 'Account not found' };

  await execute('DELETE FROM ledger WHERE accountId = ?', [id]);
  await execute('DELETE FROM accounts WHERE id = ?', [id]);

  await logAction({
    actionType: 'DELETE',
    module: 'Bank Account',
    entityId: id,
    entityName: account.accountName,
    title: `Account Deleted: ${account.accountName}`,
    details: `Deleted account "${account.accountName}" and associated ledger entries`,
    targetRoute: '/bankManagement',
  });

  return { success: true, message: 'Account deleted successfully' };
};

export const getAccountById = async (id) => {
  return queryRow('SELECT * FROM accounts WHERE id = ?', [id]);
};
