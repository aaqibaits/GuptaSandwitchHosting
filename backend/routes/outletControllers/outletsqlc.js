const { pool } = require('../../config/database');

const getClient = (client) => client || pool;

// GET all outlets
const getAllOutlets = async (client) => {
  const { rows } = await getClient(client).query(
    `SELECT o.id, o.uuid, o.name, o.address, o.phone, o.manager, o.email, o.username, o.status, o.created_by, o.created_at, o.updated_at,
            oi.access_token, oi.swiggy_id, oi.zomato_id
     FROM outlets o 
     LEFT JOIN outlet_integrations oi ON o.id = oi.outlet_id
     ORDER BY o.name ASC;`
  );
  return rows;
};

// GET all users
const getAllUsers = async (client) => {
  const { rows } = await getClient(client).query(
    `SELECT id, uuid, outlet_id, name, email, username, role_label, app_role, permissions, status, created_at, updated_at 
     FROM users 
     ORDER BY name ASC;`
  );
  return rows;
};

// INSERT a new outlet
const insertOutlet = async (data, client) => {
  const { name, address, phone, manager, email, username, password_hash, status } = data;
  const { rows } = await getClient(client).query(
    `INSERT INTO outlets (name, address, phone, manager, email, username, password_hash, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, uuid, name, address, phone, manager, email, username, status, created_at, updated_at;`,
    [name, address, phone, manager, email || null, username, password_hash, status || 'active']
  );
  return rows[0];
};

// INSERT a new user
const insertUser = async (data, client) => {
  const { outlet_id, name, email, username, password_hash, role_label, app_role, permissions, status } = data;
  const { rows } = await getClient(client).query(
    `INSERT INTO users (outlet_id, name, email, username, password_hash, role_label, app_role, permissions, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING id, uuid, outlet_id, name, email, username, role_label, app_role, permissions, status, created_at, updated_at;`,
    [outlet_id, name, email || null, username, password_hash, role_label, app_role, permissions, status || 'active']
  );
  return rows[0];
};

// UPDATE outlet
const updateOutlet = async (id, data, client) => {
  const { name, address, phone, manager, email, status } = data;
  const { rows } = await getClient(client).query(
    `UPDATE outlets 
     SET name = $1, address = $2, phone = $3, manager = $4, email = $5, status = $6, updated_at = CURRENT_TIMESTAMP
     WHERE id = $7
     RETURNING id, uuid, name, address, phone, manager, email, username, status, created_at, updated_at;`,
    [name, address, phone, manager, email || null, status || 'active', id]
  );
  return rows[0];
};

// UPDATE outlet credentials
const updateOutletCredentials = async (id, data, client) => {
  const { username, password_hash } = data;
  const { rows } = await getClient(client).query(
    `UPDATE outlets 
     SET username = $1, password_hash = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING id, uuid, name, address, phone, manager, email, username, status, created_at, updated_at;`,
    [username, password_hash, id]
  );
  return rows[0];
};

// UPDATE outlet username only
const updateOutletUsernameOnly = async (id, username, client) => {
  const { rows } = await getClient(client).query(
    `UPDATE outlets 
     SET username = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, uuid, name, address, phone, manager, email, username, status, created_at, updated_at;`,
    [username, id]
  );
  return rows[0];
};

// TOGGLE outlet status
const toggleOutletStatus = async (id, status, client) => {
  const { rows } = await getClient(client).query(
    `UPDATE outlets 
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, uuid, name, address, phone, manager, email, username, status, created_at, updated_at;`,
    [status, id]
  );
  return rows[0];
};

// DELETE outlet
const deleteOutlet = async (id, client) => {
  const { rowCount } = await getClient(client).query(
    `DELETE FROM outlets WHERE id = $1;`,
    [id]
  );
  return rowCount;
};

// DELETE users by outlet
const deleteUsersByOutlet = async (outlet_id, client) => {
  const { rowCount } = await getClient(client).query(
    `DELETE FROM users WHERE outlet_id = $1;`,
    [outlet_id]
  );
  return rowCount;
};

// UPDATE user
const updateUser = async (id, data, client) => {
  const { name, email, username, role_label, app_role, permissions, status } = data;
  const { rows } = await getClient(client).query(
    `UPDATE users 
     SET name = $1, email = $2, username = $3, role_label = $4, app_role = $5, permissions = $6::jsonb, status = $7, updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING id, uuid, outlet_id, name, email, username, role_label, app_role, permissions, status, created_at, updated_at;`,
    [name, email || null, username, role_label, app_role, permissions, status || 'active', id]
  );
  return rows[0];
};

// UPDATE user password
const updateUserPassword = async (id, password_hash, client) => {
  const { rows } = await getClient(client).query(
    `UPDATE users 
     SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, uuid, outlet_id, name, email, username, role_label, app_role, permissions, status, created_at, updated_at;`,
    [password_hash, id]
  );
  return rows[0];
};

// DELETE user
const deleteUser = async (id, client) => {
  const { rowCount } = await getClient(client).query(
    `DELETE FROM users WHERE id = $1;`,
    [id]
  );
  return rowCount;
};

// TOGGLE user status
const toggleUserStatus = async (id, status, client) => {
  const { rows } = await getClient(client).query(
    `UPDATE users 
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, uuid, outlet_id, name, email, username, role_label, app_role, permissions, status, created_at, updated_at;`,
    [status, id]
  );
  return rows[0];
};

// GET user by ID
const getUserById = async (id, client) => {
  const { rows } = await getClient(client).query(
    `SELECT id, uuid, outlet_id, name, email, username, role_label, app_role, permissions, status, created_at, updated_at 
     FROM users 
     WHERE id = $1;`,
    [id]
  );
  return rows[0];
};

// GET order stats for each active outlet grouped by periods (today, yesterday, week, month)
const getOutletDashboardStats = async (client) => {
  const { rows } = await getClient(client).query(
    `SELECT 
       o.id,
       o.name,
       COALESCE(stats.today, 0)::int AS today,
       COALESCE(stats.yesterday, 0)::int AS yesterday,
       COALESCE(stats.week, 0)::int AS week,
       COALESCE(stats.month, 0)::int AS month
     FROM outlets o
     LEFT JOIN (
       SELECT 
         outlet_id,
         COUNT(CASE WHEN DATE(order_time) = CURRENT_DATE THEN 1 END) AS today,
         COUNT(CASE WHEN DATE(order_time) = CURRENT_DATE - INTERVAL '1 day' THEN 1 END) AS yesterday,
         COUNT(CASE WHEN order_time >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) AS week,
         COUNT(CASE WHEN order_time >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) AS month
       FROM orders
       WHERE order_status != 'cancelled'
       GROUP BY outlet_id
     ) stats ON stats.outlet_id = o.id
     WHERE o.status = 'active'
     ORDER BY o.name ASC;`
  );
  return rows;
};

module.exports = {
  pool,
  getAllOutlets,
  getAllUsers,
  insertOutlet,
  insertUser,
  updateOutlet,
  updateOutletCredentials,
  updateOutletUsernameOnly,
  toggleOutletStatus,
  deleteOutlet,
  deleteUsersByOutlet,
  updateUser,
  updateUserPassword,
  deleteUser,
  toggleUserStatus,
  getUserById,
  getOutletDashboardStats
};

