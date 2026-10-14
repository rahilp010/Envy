import { query, queryRow, execute } from '../db';
import { logAction } from './helpers';

export const getTaxes = async () => {
  return query('SELECT * FROM taxes ORDER BY taxName ASC');
};

export const createTax = async ({ taxName, taxValue }) => {
  if (!taxName) {
    throw new Error('Tax name is required');
  }
  const parsedVal = parseFloat(taxValue) || 0;
  const res = await execute(
    'INSERT INTO taxes (taxName, taxValue, createdAt, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [taxName.trim(), parsedVal]
  );
  const newId = res.insertId;

  await logAction({
    actionType: 'CREATE',
    module: 'Settings',
    entityId: newId,
    entityName: taxName,
    title: 'Tax Rate Created',
    details: `Added ${taxName} at ${parsedVal}%`,
    targetRoute: '/settings',
  });

  return queryRow('SELECT * FROM taxes WHERE id = ?', [newId]);
};

export const updateTax = async ({ id, taxName, taxValue }) => {
  if (!id) throw new Error('Tax ID is required');
  const parsedVal = parseFloat(taxValue) || 0;
  await execute(
    'UPDATE taxes SET taxName = ?, taxValue = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [taxName.trim(), parsedVal, id]
  );

  await logAction({
    actionType: 'UPDATE',
    module: 'Settings',
    entityId: id,
    entityName: taxName,
    title: 'Tax Rate Updated',
    details: `Updated ${taxName} to ${parsedVal}%`,
    targetRoute: '/settings',
  });

  return queryRow('SELECT * FROM taxes WHERE id = ?', [id]);
};

export const deleteTax = async (id) => {
  if (!id) throw new Error('Tax ID is required');
  const tax = await queryRow('SELECT * FROM taxes WHERE id = ?', [id]);
  await execute('DELETE FROM taxes WHERE id = ?', [id]);

  if (tax) {
    await logAction({
      actionType: 'DELETE',
      module: 'Settings',
      entityId: id,
      entityName: tax.taxName,
      title: 'Tax Rate Deleted',
      details: `Deleted tax rate ${tax.taxName}`,
      targetRoute: '/settings',
    });
  }
  return true;
};
