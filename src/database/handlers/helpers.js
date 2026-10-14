import { execute, queryRow } from '../db';

export const toInt = (val, fallback = 0) => {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
};

export const parseParts = (partsStr) => {
  try {
    return JSON.parse(partsStr || '[]');
  } catch {
    return [];
  }
};

export const parseJsonArray = (val) => {
  let parsed = typeof val === 'string' ? parseParts(val) : val;
  if (!Array.isArray(parsed)) parsed = parsed ? [parsed] : [];
  return parsed;
};

export const toISODate = (d) => {
  if (!d) return null;
  if (typeof d === 'string') {
    const trimmed = d.trim();
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      return trimmed;
    }
    if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `${trimmed}T12:00:00.000Z`;
    }
  }
  if (d instanceof Date && !isNaN(d.getTime())) {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T12:00:00.000Z`;
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}T12:00:00.000Z`;
};

export const ALLOWED_PAYMENT_METHODS = ['cash', 'bank', 'googlepay', 'split', 'pending'];
export const BANK_LIKE_METHODS = [
  'cheque',
  'card',
  'upi',
  'neft',
  'rtgs',
  'imps',
  'banktransfer',
  'bank transfer',
];

export const normalizePaymentMethod = (method) => {
  const m = String(method || '')
    .trim()
    .toLowerCase();
  if (ALLOWED_PAYMENT_METHODS.includes(m)) return m;
  if (BANK_LIKE_METHODS.includes(m)) return 'bank';
  return 'pending';
};

export const normalizeStatus = (status) => {
  const s = String(status || '')
    .trim()
    .toLowerCase();
  return ['completed', 'pending', 'partial'].includes(s) ? s : 'pending';
};

export const normalizePaymentType = (type) =>
  String(type).toLowerCase() === 'partial' ? 'partial' : 'full';

export const normalizeMethodType = (type, fallback = 'Receipt') => {
  const t = String(type || '').trim();
  return ['Receipt', 'Payment', 'Salary'].includes(t) ? t : fallback;
};

export const isDebitNormal = (accountType) => {
  const debitNormalTypes = ['Bank', 'Cash', 'Debtor', 'Employee', 'GPay', 'Purchase', 'Expense'];
  return debitNormalTypes.includes(accountType);
};

export const logAction = async ({
  actionType = 'CREATE',
  module = 'General',
  entityId = null,
  entityName = '',
  title = '',
  details = '',
  fromSource = '',
  toDestination = '',
  amount = null,
  oldBalance = null,
  newBalance = null,
  balanceType = '',
  targetRoute = '',
  routeParams = null,
}) => {
  try {
    const paramsStr = routeParams ? JSON.stringify(routeParams) : null;
    await execute(
      `INSERT INTO action_logs
       (actionType, module, entityId, entityName, title, details, fromSource, toDestination, amount, oldBalance, newBalance, balanceType, targetRoute, routeParams, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        actionType,
        module,
        entityId,
        entityName,
        title,
        details,
        fromSource,
        toDestination,
        amount !== null ? Number(amount) : null,
        oldBalance !== null ? Number(oldBalance) : null,
        newBalance !== null ? Number(newBalance) : null,
        balanceType || null,
        targetRoute,
        paramsStr,
      ]
    );
  } catch (err) {
    console.warn('[logAction] Warning:', err.message);
  }
};
