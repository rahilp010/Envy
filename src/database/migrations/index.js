import db, { query, queryRow, execute } from '../db';

export const runMigrations = async () => {
  const database = await db.getDB();

  // Migration 1: Ensure discount column exists in sales table
  try {
    const salesTableInfo = await query('PRAGMA table_info(sales);');
    const hasSalesDiscount = salesTableInfo.some((col) => col.name === 'discount');
    if (!hasSalesDiscount) {
      await execute('ALTER TABLE sales ADD COLUMN discount REAL DEFAULT 0;');
      console.log('✅ Migration: Added discount column to sales table');
    }
  } catch (err) {
    console.warn('Migration sales discount check:', err.message);
  }

  // Migration 2: Ensure discount column exists in purchases table
  try {
    const purchasesTableInfo = await query('PRAGMA table_info(purchases);');
    const hasPurchasesDiscount = purchasesTableInfo.some((col) => col.name === 'discount');
    if (!hasPurchasesDiscount) {
      await execute('ALTER TABLE purchases ADD COLUMN discount REAL DEFAULT 0;');
      console.log('✅ Migration: Added discount column to purchases table');
    }
  } catch (err) {
    console.warn('Migration purchases discount check:', err.message);
  }

  // Migration 3: Check and migrate ledger opening entries
  try {
    await execute(`
      UPDATE ledger
      SET entryType = 'opening'
      WHERE referenceType = 'Opening' AND entryType IN ('debit', 'credit');
    `);
  } catch (err) {
    // Ignore if already compliant
  }

  return true;
};

export default runMigrations;
