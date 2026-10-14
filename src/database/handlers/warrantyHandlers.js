import { query } from '../db';

export const calculateWarrantyInfo = (saleDateStr, warrantyMonths = 12) => {
  if (!saleDateStr) return null;
  const saleDate = new Date(saleDateStr);
  if (isNaN(saleDate.getTime())) return null;

  const months = Math.max(1, Number(warrantyMonths) || 12);
  const expiryDate = new Date(saleDate);
  expiryDate.setMonth(expiryDate.getMonth() + months);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDateZero = new Date(expiryDate);
  expDateZero.setHours(0, 0, 0, 0);

  const diffMs = expDateZero.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let status = 'green';
  if (diffDays <= 60) {
    status = 'red';
  } else if (diffDays <= 180) {
    status = 'yellow';
  }

  let remainingText = '';
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays < 30) {
      remainingText = `Expired ${absDays} day${absDays === 1 ? '' : 's'} ago`;
    } else {
      const m = Math.floor(absDays / 30.4375);
      const d = Math.round(absDays % 30.4375);
      remainingText = `Expired ${m} month${m === 1 ? '' : 's'}${d > 0 ? ` ${d} day${d === 1 ? '' : 's'}` : ''} ago`;
    }
  } else if (diffDays === 0) {
    remainingText = 'Expires Today';
  } else {
    const m = Math.floor(diffDays / 30.4375);
    const d = Math.round(diffDays % 30.4375);
    const y = Math.floor(m / 12);
    const remM = m % 12;

    if (y > 0) {
      remainingText = `${y} Year${y > 1 ? 's' : ''}${remM > 0 ? ` ${remM} Month${remM > 1 ? 's' : ''}` : ''} (${diffDays} days left)`;
    } else if (m > 0) {
      remainingText = `${m} Month${m > 1 ? 's' : ''}${d > 0 ? ` ${d} Day${d > 1 ? 's' : ''}` : ''} left`;
    } else {
      remainingText = `${d} Day${d === 1 ? '' : 's'} left`;
    }
  }

  return {
    saleDate,
    expiryDate,
    diffDays,
    status, // 'red', 'yellow', 'green'
    warrantyMonths: months,
    remainingText,
    isExpiringSoon: diffDays <= 60,
  };
};

export const getWarrantyRecords = async ({ search = '', filterStatus = 'ALL' } = {}) => {
  const sales = await query(`
    SELECT s.id, s.billNo, s.date, s.clientId, s.productId, s.quantity, s.saleAmount, 
           s.multipleProducts, s.isMultiProduct,
           c.clientName, c.phoneNo as clientPhone, c.address as clientAddress,
           p.productName, p.warrantyMonths as defaultWarranty
    FROM sales s
    LEFT JOIN clients c ON s.clientId = c.id
    LEFT JOIN products p ON s.productId = p.id
    ORDER BY s.date DESC
  `);

  const results = [];

  for (const s of sales) {
    const saleDateStr = s.date;
    if (!saleDateStr) continue;

    let items = [];
    if (s.isMultiProduct && s.multipleProducts) {
      try {
        const parsed = typeof s.multipleProducts === 'string' ? JSON.parse(s.multipleProducts) : s.multipleProducts;
        if (Array.isArray(parsed) && parsed.length > 0) items = parsed;
      } catch {
        items = [];
      }
    }

    if (items.length === 0) {
      items = [
        {
          productId: s.productId,
          productName: s.productName || 'Product',
          quantity: s.quantity || 1,
          saleAmount: s.saleAmount || 0,
          warrantyMonths: s.defaultWarranty || 12,
        },
      ];
    }

    items.forEach((item, idx) => {
      const wMonths = item.warrantyMonths || s.defaultWarranty || 12;
      const info = calculateWarrantyInfo(saleDateStr, wMonths);
      if (!info) return;

      const record = {
        id: `${s.id}-${idx}`,
        saleId: s.id,
        billNo: s.billNo || `SAL-${s.id}`,
        clientName: s.clientName || 'General Client',
        clientPhone: s.clientPhone || '',
        clientAddress: s.clientAddress || '',
        productName: item.productName || s.productName || 'Standard Item',
        quantity: item.quantity || 1,
        saleDate: info.saleDate.toISOString().split('T')[0],
        expiryDate: info.expiryDate.toISOString().split('T')[0],
        diffDays: info.diffDays,
        status: info.status,
        remainingText: info.remainingText,
        warrantyMonths: info.warrantyMonths,
        isExpiringSoon: info.isExpiringSoon,
      };

      if (filterStatus !== 'ALL' && record.status !== filterStatus) return;

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        const matches =
          (record.clientName && record.clientName.toLowerCase().includes(q)) ||
          (record.productName && record.productName.toLowerCase().includes(q)) ||
          (record.billNo && record.billNo.toLowerCase().includes(q));
        if (!matches) return;
      }

      results.push(record);
    });
  }

  const statusPriority = { red: 1, yellow: 2, green: 3 };
  return results.sort((a, b) => {
    if (statusPriority[a.status] !== statusPriority[b.status]) {
      return statusPriority[a.status] - statusPriority[b.status];
    }
    return a.diffDays - b.diffDays;
  });
};
