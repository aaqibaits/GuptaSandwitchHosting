const { pool } = require('../../config/database');

/**
 * Fetches activity logs with optional filters and joins user/admin/outlet names.
 */
const getAuditLogs = async (filters = {}) => {
  const { action, entityType, outletId, adminId, userId, startDate, endDate, limit = 100, offset = 0 } = filters;
  
  let queryString = `
    SELECT 
      al.*,
      a.name AS admin_name,
      a.username AS admin_username,
      u.name AS user_name,
      u.username AS user_username,
      o.name AS outlet_name
    FROM activity_logs al
    LEFT JOIN admin a ON al.admin_id = a.id
    LEFT JOIN users u ON al.user_id = u.id
    LEFT JOIN outlets o ON al.outlet_id = o.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;

  if (action) {
    queryString += ` AND al.action = $${paramIndex++}`;
    params.push(action);
  }

  if (entityType) {
    queryString += ` AND al.entity_type = $${paramIndex++}`;
    params.push(entityType);
  }

  if (outletId) {
    queryString += ` AND al.outlet_id = $${paramIndex++}`;
    params.push(Number(outletId));
  }

  if (adminId) {
    queryString += ` AND al.admin_id = $${paramIndex++}`;
    params.push(Number(adminId));
  }

  if (userId) {
    queryString += ` AND al.user_id = $${paramIndex++}`;
    params.push(Number(userId));
  }

  if (startDate) {
    queryString += ` AND al.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    queryString += ` AND al.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }

  queryString += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(Number(limit), Number(offset));

  const result = await pool.query(queryString, params);
  return result.rows;
};

/**
 * Fetches count of activity logs with optional filters.
 */
const getAuditLogsCount = async (filters = {}) => {
  const { action, entityType, outletId, adminId, userId, startDate, endDate } = filters;
  
  let queryString = `
    SELECT COUNT(*) AS total
    FROM activity_logs al
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;

  if (action) {
    queryString += ` AND al.action = $${paramIndex++}`;
    params.push(action);
  }

  if (entityType) {
    queryString += ` AND al.entity_type = $${paramIndex++}`;
    params.push(entityType);
  }

  if (outletId) {
    queryString += ` AND al.outlet_id = $${paramIndex++}`;
    params.push(Number(outletId));
  }

  if (adminId) {
    queryString += ` AND al.admin_id = $${paramIndex++}`;
    params.push(Number(adminId));
  }

  if (userId) {
    queryString += ` AND al.user_id = $${paramIndex++}`;
    params.push(Number(userId));
  }

  if (startDate) {
    queryString += ` AND al.created_at >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    queryString += ` AND al.created_at <= $${paramIndex++}`;
    params.push(endDate);
  }

  const result = await pool.query(queryString, params);
  return parseInt(result.rows[0].total, 10);
};

module.exports = {
  pool,
  getAuditLogs,
  getAuditLogsCount
};
