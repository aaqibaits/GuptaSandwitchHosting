const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');

/**
 * Inserts a structured audit log entry into the activity_logs table.
 */
const logActivity = async ({
  req,
  action,
  entityType = null,
  entityId = null,
  oldValues = null,
  newValues = null,
  userId = null,
  adminId = null,
  outletId = null
}) => {
  try {
    let ipAddress = null;

    if (req) {
      // 1. Extract IP Address
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
      if (ipAddress && ipAddress.includes('::ffff:')) {
        ipAddress = ipAddress.split('::ffff:')[1];
      }

      // 2. Decode JWT if present in authorization headers
      let token = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (token) {
        try {
          // Attempt verification first
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded.type === 'admin') {
            if (!adminId) adminId = decoded.id;
          } else {
            if (!userId) userId = decoded.id;
            if (!outletId) outletId = decoded.outlet_id;
          }
        } catch (jwtErr) {
          // Fallback to unverified decode in case of secret mismatches/expiry
          try {
            const decoded = jwt.decode(token);
            if (decoded) {
              if (decoded.type === 'admin') {
                if (!adminId) adminId = decoded.id;
              } else {
                if (!userId) userId = decoded.id;
                if (!outletId) outletId = decoded.outlet_id;
              }
            }
          } catch (decodeErr) {
            // Ignore decode failures
          }
        }
      }

      // Fallback if req.user is already populated by authMiddleware
      if (req.user) {
        if (req.userType === 'admin') {
          if (!adminId) adminId = req.user.id;
        } else {
          if (!userId) userId = req.user.id;
          if (!outletId) outletId = req.user.outlet_id || req.user.outletId || null;
        }
      }

      // Fallback to body/query parameters if still missing (useful for logins or custom POS requests)
      if (!outletId && req.body) {
        outletId = req.body.outletId || req.body.outlet_id || null;
      }
      if (!outletId && req.query) {
        outletId = req.query.outletId || req.query.outlet_id || null;
      }
      if (!userId && req.body) {
        userId = req.body.userId || req.body.user_id || req.body.createdBy || null;
      }
    }

    const query = `
      INSERT INTO activity_logs (user_id, outlet_id, admin_id, action, entity_type, entity_id, old_values, new_values, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const values = [
      userId ? parseInt(userId, 10) : null,
      outletId ? parseInt(outletId, 10) : null,
      adminId ? parseInt(adminId, 10) : null,
      action,
      entityType,
      entityId ? parseInt(entityId, 10) : null,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress
    ];

    await pool.query(query, values);
  } catch (error) {
    console.error('⚠️ [Audit Log Error]:', error);
  }
};

module.exports = { logActivity };
