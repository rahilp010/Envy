import { query, queryRow, execute } from '../db';
import { logAction } from './helpers';

export const getCompanyProfile = async () => {
  let profile = await queryRow('SELECT * FROM company_profile WHERE id = 1');
  if (!profile) {
    await execute(
      `INSERT INTO company_profile (id, companyName, tagline, address, phone, email, gstin, pan, website, bankName, bankAccNo, bankIfsc, bankBranch, terms)
       VALUES (1, 'ENVY ERP', 'Industrial & Commercial Solutions', '', '', '', '', '', '', '', '', '', '', ?)`,
      [
        '1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if payment is delayed.\n3. Subject to Jurisdiction.',
      ]
    );
    profile = await queryRow('SELECT * FROM company_profile WHERE id = 1');
  }
  return profile;
};

export const updateCompanyProfile = async (data = {}) => {
  await execute(
    `UPDATE company_profile SET
      companyName = ?, tagline = ?, address = ?, phone = ?, email = ?,
      gstin = ?, pan = ?, website = ?, bankName = ?, bankAccNo = ?,
      bankIfsc = ?, bankBranch = ?, terms = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = 1`,
    [
      data.companyName ?? 'ENVY ERP',
      data.tagline ?? '',
      data.address ?? '',
      data.phone ?? '',
      data.email ?? '',
      data.gstin ?? '',
      data.pan ?? '',
      data.website ?? '',
      data.bankName ?? '',
      data.bankAccNo ?? '',
      data.bankIfsc ?? '',
      data.bankBranch ?? '',
      data.terms ?? '',
    ]
  );

  await logAction({
    actionType: 'UPDATE',
    module: 'Settings',
    title: 'Company Profile Updated',
    details: `Updated details for ${data.companyName || 'Company'}`,
    targetRoute: '/settings',
  });

  return getCompanyProfile();
};

export const getSettings = async () => {
  return query('SELECT * FROM settings ORDER BY createdAt DESC');
};

export const updateSetting = async (taxName, taxValue) => {
  const existing = await queryRow('SELECT * FROM settings WHERE taxName = ?', [taxName]);
  if (existing) {
    await execute(
      'UPDATE settings SET taxValue = ?, updatedAt = CURRENT_TIMESTAMP WHERE taxName = ?',
      [String(taxValue), taxName]
    );
  } else {
    await execute(
      'INSERT INTO settings (taxName, taxValue, createdAt, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [taxName, String(taxValue)]
    );
  }
  return true;
};

export const globalSearch = async (term) => {
  if (!term || !term.trim()) {
    return { products: [], clients: [], sales: [], purchases: [] };
  }
  const clean = `%${term.trim()}%`;

  const [products, clients, sales, purchases] = await Promise.all([
    query('SELECT id, productName, productPrice, productQuantity, assetsType FROM products WHERE productName LIKE ? OR saleHSN LIKE ? LIMIT 6', [clean, clean]),
    query('SELECT id, clientName, phoneNo, gstNo, accountType, pendingAmount FROM clients WHERE clientName LIKE ? OR phoneNo LIKE ? OR gstNo LIKE ? LIMIT 6', [clean, clean, clean]),
    query('SELECT s.id, s.billNo, s.totalAmountWithTax, s.date, c.clientName FROM sales s LEFT JOIN clients c ON s.clientId = c.id WHERE s.billNo LIKE ? OR c.clientName LIKE ? LIMIT 6', [clean, clean]),
    query('SELECT p.id, p.billNo, p.totalAmountWithTax, p.date, c.clientName FROM purchases p LEFT JOIN clients c ON p.clientId = c.id WHERE p.billNo LIKE ? OR c.clientName LIKE ? LIMIT 6', [clean, clean]),
  ]);

  return { products, clients, sales, purchases };
};
