import { query, queryRow, execute } from '../db';

export const getActionLogs = async ({
  page = 1,
  limit = 50,
  search = '',
  actionType = '',
  module = '',
} = {}) => {
  let whereClauses = [];
  let params = [];

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    whereClauses.push('(title LIKE ? OR details LIKE ? OR entityName LIKE ?)');
    params.push(s, s, s);
  }

  if (actionType && actionType !== 'ALL') {
    whereClauses.push('actionType = ?');
    params.push(actionType);
  }

  if (module && module !== 'ALL') {
    whereClauses.push('module = ?');
    params.push(module);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const totalRow = await queryRow(
    `SELECT COUNT(*) as count FROM action_logs ${whereSql}`,
    params
  );
  const total = totalRow ? totalRow.count : 0;

  const offset = Math.max(0, (page - 1) * limit);
  const rows = await query(
    `SELECT * FROM action_logs ${whereSql} ORDER BY createdAt DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    logs: rows || [],
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
};

export const deleteActionLog = async (id) => {
  if (!id) return false;
  await execute('DELETE FROM action_logs WHERE id = ?', [id]);
  return true;
};

export const clearActionLogs = async () => {
  await execute('DELETE FROM action_logs');
  return true;
};

export const cleanUpOldActionLogs = async (days = 30) => {
  await execute(
    `DELETE FROM action_logs WHERE createdAt < datetime('now', '-${parseInt(days, 10)} days')`
  );
  return true;
};
