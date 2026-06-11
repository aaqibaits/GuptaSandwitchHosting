const sql = require('./auditLogsSqlc');

/**
 * GET /api/audit-logs
 * Retrieves paginated audit logs with support for optional filtering.
 */
const fetchLogs = async (req, res) => {
  try {
    const { action, entityType, outletId, adminId, userId, startDate, endDate, limit, offset } = req.query;
    
    const filters = {
      action,
      entityType,
      outletId,
      adminId,
      userId,
      startDate,
      endDate,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0
    };

    const logs = await sql.getAuditLogs(filters);
    const total = await sql.getAuditLogsCount(filters);

    res.status(200).json({
      success: true,
      total,
      limit: filters.limit,
      offset: filters.offset,
      data: logs
    });
  } catch (error) {
    console.error('fetchLogs Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'An error occurred on the server.'
    });
  }
};

module.exports = {
  fetchLogs
};
