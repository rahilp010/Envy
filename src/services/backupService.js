import { query, execute } from '../database/db';

const TABLES = [
  'products',
  'clients',
  'accounts',
  'sales',
  'purchases',
  'ledger',
  'purchase_payments',
  'settings',
  'taxes',
  'action_logs',
  'company_profile',
];

export const getDatabaseStats = async () => {
  const stats = {};
  for (const table of TABLES) {
    try {
      const rows = await query(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = rows && rows[0] ? rows[0].count : 0;
    } catch {
      stats[table] = 0;
    }
  }
  return stats;
};

export const exportDatabaseToJson = async () => {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    appName: 'ENVY ERP Mobile',
    tables: {},
  };

  for (const table of TABLES) {
    try {
      const rows = await query(`SELECT * FROM ${table}`);
      data.tables[table] = rows || [];
    } catch (err) {
      console.warn(`Export skipping table ${table}:`, err.message);
      data.tables[table] = [];
    }
  }

  return JSON.stringify(data, null, 2);
};

export const importDatabaseFromJson = async (jsonString) => {
  if (!jsonString) throw new Error('No JSON data provided for restore');
  
  let parsed;
  try {
    parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
  } catch (err) {
    throw new Error('Invalid JSON format');
  }

  if (!parsed.tables || typeof parsed.tables !== 'object') {
    throw new Error('Backup format invalid: missing tables object');
  }

  // Restore each table
  for (const table of TABLES) {
    const rows = parsed.tables[table];
    if (Array.isArray(rows) && rows.length > 0) {
      // Clear current rows for clean restore
      try {
        await execute(`DELETE FROM ${table}`);
        for (const row of rows) {
          const keys = Object.keys(row);
          if (keys.length === 0) continue;
          const placeholders = keys.map(() => '?').join(', ');
          const values = keys.map((k) => row[k]);
          await execute(
            `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
            values
          );
        }
      } catch (tableErr) {
        console.warn(`Error restoring table ${table}:`, tableErr.message);
      }
    }
  }

  return true;
};
