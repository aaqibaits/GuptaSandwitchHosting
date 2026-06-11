const { pool } = require('../../config/database');

// Helper function to handle single row results
const getSingleRow = (result) => {
  return result.rows.length > 0 ? result.rows[0] : null;
};

// ─────────────────────────────────────────────
//  ADMIN QUERIES
// ─────────────────────────────────────────────

// Find admin by username
const findAdminByUsername = async (username) => {
  const result = await pool.query(
    `SELECT id, uuid, name, email, username, password_hash,
            phone, role, is_super_admin, permissions, status, last_login
     FROM admin
     WHERE username = $1
       AND status = 'active'
     LIMIT 1`,
    [username]
  );
  return getSingleRow(result);
};

// Find admin by email
const findAdminByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, uuid, name, email, username, password_hash,
            phone, role, is_super_admin, permissions, status, last_login
     FROM admin
     WHERE email = $1
       AND status = 'active'
     LIMIT 1`,
    [email]
  );
  return getSingleRow(result);
};

// Find admin by id
const findAdminById = async (id) => {
  const result = await pool.query(
    `SELECT id, uuid, name, email, username,
            phone, role, is_super_admin, permissions, status, last_login
     FROM admin
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return getSingleRow(result);
};

// Update admin last_login timestamp
const updateAdminLastLogin = async (id) => {
  await pool.query(
    `UPDATE admin
     SET last_login = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [id]
  );
};

// ─────────────────────────────────────────────
//  USER QUERIES
// ─────────────────────────────────────────────

// Find user by username
const findUserByUsername = async (username) => {
  const result = await pool.query(
    `SELECT u.id, u.uuid, u.outlet_id, u.name, u.email, u.username, u.password_hash,
            u.role_label, u.app_role, u.permissions, u.status,
            o.name AS outlet_name
     FROM users u
     LEFT JOIN outlets o ON o.id = u.outlet_id
     WHERE u.username = $1
       AND u.status = 'active'
     LIMIT 1`,
    [username]
  );
  return getSingleRow(result);
};

// Find user by email
const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT u.id, u.uuid, u.outlet_id, u.name, u.email, u.username, u.password_hash,
            u.role_label, u.app_role, u.permissions, u.status,
            o.name AS outlet_name
     FROM users u
     LEFT JOIN outlets o ON o.id = u.outlet_id
     WHERE u.email = $1
       AND u.status = 'active'
     LIMIT 1`,
    [email]
  );
  return getSingleRow(result);
};

// Find user by id
const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, uuid, outlet_id, name, email, username,
            role_label, app_role, permissions, status, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return getSingleRow(result);
};

// Find user with their outlet info (for full profile)
const findUserWithOutlet = async (id) => {
  const result = await pool.query(
    `SELECT u.id, u.uuid, u.name, u.email, u.username,
            u.role_label, u.app_role, u.permissions, u.status,
            o.id        AS outlet_id,
            o.name      AS outlet_name,
            o.address   AS outlet_address,
            o.phone     AS outlet_phone
     FROM users u
     LEFT JOIN outlets o ON u.outlet_id = o.id
     WHERE u.id = $1
     LIMIT 1`,
    [id]
  );
  return getSingleRow(result);
};

// ─────────────────────────────────────────────
//  SESSION QUERIES
// ─────────────────────────────────────────────

// Insert a new session
const insertSession = async (data) => {
  const { user_id, outlet_id, token, ip_address, user_agent } = data;
  const result = await pool.query(
    `INSERT INTO sessions (user_id, outlet_id, token, login_time, ip_address, user_agent)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5)
     RETURNING *`,
    [user_id, outlet_id, token, ip_address, user_agent]
  );
  return result.rows[0];
};

// Find session by token
const findSessionByToken = async (token) => {
  const result = await pool.query(
    `SELECT id, user_id, outlet_id, token, login_time, logout_time
     FROM sessions
     WHERE token = $1
       AND logout_time IS NULL
     LIMIT 1`,
    [token]
  );
  return getSingleRow(result);
};

// Logout — set logout_time on the session
const logoutSession = async (token) => {
  await pool.query(
    `UPDATE sessions
     SET logout_time = CURRENT_TIMESTAMP
     WHERE token = $1`,
    [token]
  );
};

// Logout all sessions for a user (e.g. force-logout)
const logoutAllUserSessions = async (user_id) => {
  await pool.query(
    `UPDATE sessions
     SET logout_time = CURRENT_TIMESTAMP
     WHERE user_id = $1
       AND logout_time IS NULL`,
    [user_id]
  );
};

module.exports = {
  // Admin
  findAdminByUsername,
  findAdminByEmail,
  findAdminById,
  updateAdminLastLogin,

  // User
  findUserByUsername,
  findUserByEmail,
  findUserById,
  findUserWithOutlet,
  
  // Session
  insertSession,
  findSessionByToken,
  logoutSession,
  logoutAllUserSessions,
};