import { queryRow } from '../db';

export const incrementBillNo = (billNo) => {
  if (!billNo) return '1';
  const match = billNo.match(/(\d+)(?!.*\d)/);
  if (match) {
    const numStr = match[1];
    const nextNum = parseInt(numStr, 10) + 1;
    const nextNumStr = String(nextNum).padStart(numStr.length, '0');
    const lastIndex = billNo.lastIndexOf(numStr);
    return (
      billNo.substring(0, lastIndex) +
      nextNumStr +
      billNo.substring(lastIndex + numStr.length)
    );
  }
  return billNo + '-1';
};

export const generateMonthlyBillNo = async (tableName, prefix) => {
  const now = new Date();
  const year2Digit = String(now.getFullYear()).slice(-2);
  const month2Digit = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthPrefix = `${prefix}${year2Digit}${month2Digit}`;
  const seqPadLength = prefix === 'PUR' ? 5 : 4;

  const row = await queryRow(
    `SELECT billNo FROM ${tableName}
     WHERE billNo IS NOT NULL AND TRIM(billNo) != '' AND billNo LIKE ?
     ORDER BY id DESC LIMIT 1`,
    [`${currentMonthPrefix}%`]
  );

  if (!row || !row.billNo) {
    const initialSeq = '1'.padStart(seqPadLength, '0');
    return `${currentMonthPrefix}${initialSeq}`;
  }

  const seqStr = row.billNo.slice(currentMonthPrefix.length);
  const nextNum = parseInt(seqStr, 10) + 1;
  if (isNaN(nextNum)) {
    const initialSeq = '1'.padStart(seqPadLength, '0');
    return `${currentMonthPrefix}${initialSeq}`;
  }

  const nextSeqStr = String(nextNum).padStart(
    Math.max(seqStr.length, seqPadLength),
    '0'
  );
  return `${currentMonthPrefix}${nextSeqStr}`;
};

export const generateSalesBillNo = async () => {
  return generateMonthlyBillNo('sales', 'SAL');
};

export const generatePurchaseBillNo = async () => {
  return generateMonthlyBillNo('purchases', 'PUR');
};
