import { query, queryRow } from '../db';

export const getPendingCollections = async () => {
  return query(`
    SELECT c.id, c.clientName, c.phoneNo, c.address, c.gstNo,
           COALESCE(SUM(s.pendingAmount), 0) AS pendingTotal,
           COUNT(s.id) AS pendingInvoicesCount
    FROM clients c
    INNER JOIN sales s ON s.clientId = c.id
    WHERE s.pendingAmount > 0
    GROUP BY c.id
    ORDER BY pendingTotal DESC
  `);
};

export const getPendingPayments = async () => {
  return query(`
    SELECT c.id, c.clientName, c.phoneNo, c.address, c.gstNo,
           COALESCE(SUM(p.pendingAmount), 0) AS pendingTotal,
           COUNT(p.id) AS pendingBillsCount
    FROM clients c
    INNER JOIN purchases p ON p.clientId = c.id
    WHERE p.pendingAmount > 0
    GROUP BY c.id
    ORDER BY pendingTotal DESC
  `);
};

export const getTransferHistory = async () => {
  return query(`
    SELECT DISTINCT referenceId, date, amount, narration, createdAt
    FROM ledger
    WHERE referenceType = 'Transfer'
    ORDER BY date DESC, createdAt DESC
  `);
};

export const getTrialBalance = async () => {
  const accounts = await query(`
    SELECT id, accountName, accountType, closingBalance, closingBalanceType
    FROM accounts
    WHERE status = 'active'
    ORDER BY accountType ASC, accountName ASC
  `);

  let totalDebit = 0;
  let totalCredit = 0;

  const rows = accounts.map((acc) => {
    const bal = Number(acc.closingBalance || 0);
    const isDebit = acc.closingBalanceType === 'DR';
    if (isDebit) totalDebit += bal;
    else totalCredit += bal;

    return {
      ...acc,
      debit: isDebit ? bal : 0,
      credit: !isDebit ? bal : 0,
    };
  });

  return {
    rows,
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
  };
};

export const getTodaysAnalytics = async () => {
  const today = new Date().toISOString().split('T')[0];

  const salesToday = await queryRow(
    `SELECT COALESCE(SUM(totalAmountWithTax), 0) AS total,
            COALESCE(SUM(paidAmount), 0) AS paid,
            COALESCE(SUM(pendingAmount), 0) AS pending,
            COUNT(*) AS count
     FROM sales WHERE date(date) = date(?)`,
    [today]
  );

  const purchasesToday = await queryRow(
    `SELECT COALESCE(SUM(totalAmountWithTax), 0) AS total,
            COALESCE(SUM(paidAmount), 0) AS paid,
            COALESCE(SUM(pendingAmount), 0) AS pending,
            COUNT(*) AS count
     FROM purchases WHERE date(date) = date(?)`,
    [today]
  );

  return {
    today,
    sales: salesToday || { total: 0, paid: 0, pending: 0, count: 0 },
    purchases: purchasesToday || { total: 0, paid: 0, pending: 0, count: 0 },
  };
};
