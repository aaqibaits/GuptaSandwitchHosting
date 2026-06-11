const queries = require('./outletsqlc');
const pool = queries.pool;
const bcrypt = require('bcryptjs');
const { logActivity } = require('../../utils/auditLogger');

// Helper to send errors
const sendError = (res, error, status = 500) => {
  console.error('Controller Error:', error);
  res.status(status).json({
    success: false,
    message: error.message || 'An error occurred on the server.'
  });
};

// Helper to map DB user structure to frontend camelCase structure
const mapUserToFrontend = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    uuid: user.uuid,
    outletId: user.outlet_id,
    name: user.name,
    email: user.email,
    username: user.username,
    roleLabel: user.role_label,
    appRole: user.app_role,
    permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
};

// GET all outlets with nested users
const getAllOutlets = async (req, res) => {
  try {
    // 1. Fetch all outlets
    const outlets = await queries.getAllOutlets();

    // 2. Fetch all users
    const users = await queries.getAllUsers();

    // 3. Map users to their respective outlets
    const outletsWithUsers = outlets.map(outlet => {
      const outletUsers = users.filter(user => user.outlet_id === outlet.id);
      return {
        ...outlet,
        users: outletUsers.map(mapUserToFrontend)
      };
    });

    res.status(200).json({
      success: true,
      data: outletsWithUsers
    });
  } catch (error) {
    sendError(res, error);
  }
};

// ADD a new outlet (and auto-create Manager user)
const addOutlet = async (req, res) => {
  const { name, address, phone, manager, email, username, password, status, access_token, swiggy_id, zomato_id } = req.body;

  if (!name || !address || !phone || !manager || !username || !password || !access_token) {
    return res.status(400).json({
      success: false,
      message: 'Name, address, phone, manager, username, password, and access token are required.'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Hash the password for the outlet login
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. Insert the outlet
    const newOutlet = await queries.insertOutlet({
      name,
      address,
      phone,
      manager,
      email,
      username,
      password_hash: passwordHash,
      status
    }, client);

    // 1b. Insert the integration details
    await client.query(
      `INSERT INTO outlet_integrations (outlet_id, access_token, swiggy_id, zomato_id)
       VALUES ($1, $2, $3, $4)`,
      [newOutlet.id, access_token, swiggy_id || null, zomato_id || null]
    );

    // 2. Insert the manager user automatically in users table
    const defaultManagerPermissions = {
      admin: ["dashboard", "dishes", "reports", "accounting", "outlets"],
      staff: []
    };

    await queries.insertUser({
      outlet_id: newOutlet.id,
      name: manager,
      email,
      username,
      password_hash: passwordHash,
      role_label: 'Manager',
      app_role: 'Admin',
      permissions: JSON.stringify(defaultManagerPermissions),
      status
    }, client);

    await client.query('COMMIT');

    logActivity({
      req,
      action: 'OUTLET_CREATE',
      entityType: 'outlet',
      entityId: newOutlet.id,
      outletId: newOutlet.id,
      newValues: { ...newOutlet, access_token, swiggy_id, zomato_id }
    });

    // Get the newly created outlet with integration details
    res.status(201).json({
      success: true,
      data: {
        ...newOutlet,
        access_token,
        swiggy_id,
        zomato_id,
        users: []
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    sendError(res, error);
  } finally {
    client.release();
  }
};

// UPDATE outlet details (non-credentials)
const updateOutlet = async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, manager, email, status, access_token, swiggy_id, zomato_id, username, password } = req.body;

  if (!name || !address || !phone || !manager || !access_token || !username) {
    return res.status(400).json({
      success: false,
      message: 'Name, address, phone, manager, access token, and username are required.'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows: oldRows } = await client.query('SELECT * FROM outlets WHERE id = $1', [id]);
    const oldOutlet = oldRows[0];

    if (!oldOutlet) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Outlet not found.'
      });
    }

    const updatedOutlet = await queries.updateOutlet(id, {
      name,
      address,
      phone,
      manager,
      email,
      status
    }, client);

    // Update credentials
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await client.query(
        `UPDATE outlets 
         SET username = $1, password_hash = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [username, passwordHash, id]
      );
    } else {
      await client.query(
        `UPDATE outlets 
         SET username = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [username, id]
      );
    }

    // Upsert integration details
    const { rows: integrationRows } = await client.query('SELECT 1 FROM outlet_integrations WHERE outlet_id = $1', [id]);
    if (integrationRows.length > 0) {
      await client.query(
        `UPDATE outlet_integrations 
         SET access_token = $1, swiggy_id = $2, zomato_id = $3
         WHERE outlet_id = $4`,
        [access_token, swiggy_id || null, zomato_id || null, id]
      );
    } else {
      await client.query(
        `INSERT INTO outlet_integrations (outlet_id, access_token, swiggy_id, zomato_id)
         VALUES ($1, $2, $3, $4)`,
        [id, access_token, swiggy_id || null, zomato_id || null]
      );
    }

    await client.query('COMMIT');

    logActivity({
      req,
      action: 'OUTLET_UPDATE',
      entityType: 'outlet',
      entityId: id,
      outletId: id,
      oldValues: oldOutlet,
      newValues: { ...updatedOutlet, username, access_token, swiggy_id, zomato_id }
    });

    // Fetch the updated outlet with its integrations and users to return the complete object
    const { rows: updatedOutletRows } = await pool.query(
      `SELECT o.id, o.uuid, o.name, o.address, o.phone, o.manager, o.email, o.username, o.status, o.created_by, o.created_at, o.updated_at,
              oi.access_token, oi.swiggy_id, oi.zomato_id
       FROM outlets o
       LEFT JOIN outlet_integrations oi ON o.id = oi.outlet_id
       WHERE o.id = $1`,
      [id]
    );

    const users = await queries.getAllUsers();

    res.status(200).json({
      success: true,
      data: {
        ...updatedOutletRows[0],
        users: users.filter(user => user.outlet_id === Number(id)).map(mapUserToFrontend)
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    sendError(res, error);
  } finally {
    client.release();
  }
};

// UPDATE outlet credentials (username, password)
const updateOutletCredentials = async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({
      success: false,
      message: 'Username is required.'
    });
  }

  try {
    const { rows: oldRows } = await pool.query('SELECT id, username FROM outlets WHERE id = $1', [id]);
    const oldOutlet = oldRows[0];

    let updatedOutlet;
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updatedOutlet = await queries.updateOutletCredentials(id, {
        username,
        password_hash: passwordHash
      });
    } else {
      updatedOutlet = await queries.updateOutletUsernameOnly(id, username);
    }

    if (!updatedOutlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found.'
      });
    }

    logActivity({
      req,
      action: 'OUTLET_CREDS_UPDATE',
      entityType: 'outlet',
      entityId: id,
      outletId: id,
      oldValues: { username: oldOutlet?.username },
      newValues: { username: updatedOutlet.username }
    });

    const users = await queries.getAllUsers();

    res.status(200).json({
      success: true,
      data: {
        ...updatedOutlet,
        users: users.filter(user => user.outlet_id === Number(id)).map(mapUserToFrontend)
      }
    });
  } catch (error) {
    sendError(res, error);
  }
};

// TOGGLE outlet status
const toggleOutletStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || (status !== 'active' && status !== 'inactive')) {
    return res.status(400).json({
      success: false,
      message: 'Status must be active or inactive.'
    });
  }

  try {
    const { rows: oldRows } = await pool.query('SELECT id, status FROM outlets WHERE id = $1', [id]);
    const oldOutlet = oldRows[0];

    const updatedOutlet = await queries.toggleOutletStatus(id, status);

    if (!updatedOutlet) {
      return res.status(404).json({
        success: false,
        message: 'Outlet not found.'
      });
    }

    logActivity({
      req,
      action: 'OUTLET_STATUS_TOGGLE',
      entityType: 'outlet',
      entityId: id,
      outletId: id,
      oldValues: { status: oldOutlet?.status },
      newValues: { status: updatedOutlet.status }
    });

    const users = await queries.getAllUsers();

    res.status(200).json({
      success: true,
      data: {
        ...updatedOutlet,
        users: users.filter(user => user.outlet_id === Number(id)).map(mapUserToFrontend)
      }
    });
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE outlet and its users
const deleteOutlet = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    const { rows: oldRows } = await client.query('SELECT * FROM outlets WHERE id = $1', [id]);
    const oldOutlet = oldRows[0];
    const { rows: oldUsers } = await client.query('SELECT * FROM users WHERE outlet_id = $1', [id]);

    await client.query('BEGIN');

    // 1. Delete associated users first
    await queries.deleteUsersByOutlet(id, client);

    // 2. Delete the outlet
    const deletedCount = await queries.deleteOutlet(id, client);

    if (deletedCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Outlet not found.'
      });
    }

    await client.query('COMMIT');

    logActivity({
      req,
      action: 'OUTLET_DELETE',
      entityType: 'outlet',
      entityId: id,
      outletId: id,
      oldValues: { outlet: oldOutlet, users: oldUsers }
    });

    res.status(200).json({
      success: true,
      message: 'Outlet and its users deleted successfully.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    sendError(res, error);
  } finally {
    client.release();
  }
};

// ADD a user to an outlet
const addUserToOutlet = async (req, res) => {
  const { id } = req.params; // outlet_id
  const { name, email, username, password, roleLabel, appRole, permissions, status } = req.body;

  if (!name || !username || !password || !roleLabel || !appRole || !permissions) {
    return res.status(400).json({
      success: false,
      message: 'Name, username, password, roleLabel, appRole, and permissions are required.'
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await queries.insertUser({
      outlet_id: id,
      name,
      email,
      username,
      password_hash: passwordHash,
      role_label: roleLabel,
      app_role: appRole,
      permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
      status
    });

    logActivity({
      req,
      action: 'STAFF_USER_CREATE',
      entityType: 'user',
      entityId: newUser.id,
      outletId: id,
      newValues: { id: newUser.id, name: newUser.name, username: newUser.username, email: newUser.email, role_label: newUser.role_label, app_role: appRole, status: newUser.status }
    });

    res.status(201).json({
      success: true,
      data: mapUserToFrontend(newUser)
    });
  } catch (error) {
    sendError(res, error);
  }
};

// UPDATE a user under an outlet
const updateOutletUser = async (req, res) => {
  const { userId } = req.params;
  const { name, email, username, password, roleLabel, appRole, permissions, status } = req.body;

  if (!name || !username || !roleLabel || !appRole || !permissions) {
    return res.status(400).json({
      success: false,
      message: 'Name, username, roleLabel, appRole, and permissions are required.'
    });
  }

  const client = await pool.connect();

  try {
    const oldUser = await queries.getUserById(userId, client);

    await client.query('BEGIN');

    // 1. Update general info
    const updatedUser = await queries.updateUser(userId, {
      name,
      email,
      username,
      role_label: roleLabel,
      app_role: appRole,
      permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions),
      status
    }, client);

    if (!updatedUser) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // 2. Update password if provided
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await queries.updateUserPassword(userId, passwordHash, client);
    }

    // Fetch final user record
    const finalUser = await queries.getUserById(userId, client);

    await client.query('COMMIT');

    logActivity({
      req,
      action: 'STAFF_USER_UPDATE',
      entityType: 'user',
      entityId: userId,
      outletId: finalUser ? finalUser.outlet_id : null,
      oldValues: oldUser,
      newValues: finalUser
    });

    res.status(200).json({
      success: true,
      data: mapUserToFrontend(finalUser)
    });
  } catch (error) {
    await client.query('ROLLBACK');
    sendError(res, error);
  } finally {
    client.release();
  }
};

// DELETE a user
const deleteOutletUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const { rows: oldRows } = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const oldUser = oldRows[0];

    const deletedCount = await queries.deleteUser(userId);

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    logActivity({
      req,
      action: 'STAFF_USER_DELETE',
      entityType: 'user',
      entityId: userId,
      outletId: oldUser ? oldUser.outlet_id : null,
      oldValues: oldUser
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    sendError(res, error);
  }
};

// TOGGLE user status
const toggleOutletUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!status || (status !== 'active' && status !== 'inactive')) {
    return res.status(400).json({
      success: false,
      message: 'Status must be active or inactive.'
    });
  }

  try {
    const { rows: oldRows } = await pool.query('SELECT id, status FROM users WHERE id = $1', [userId]);
    const oldUser = oldRows[0];

    const updatedUser = await queries.toggleUserStatus(userId, status);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    logActivity({
      req,
      action: 'STAFF_USER_STATUS_TOGGLE',
      entityType: 'user',
      entityId: userId,
      outletId: updatedUser ? updatedUser.outlet_id : null,
      oldValues: { status: oldUser?.status },
      newValues: { status: updatedUser.status }
    });

    res.status(200).json({
      success: true,
      data: mapUserToFrontend(updatedUser)
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET consolidated dashboard statistics across active outlets
const getOutletDashboardStats = async (req, res) => {
  try {
    const rawStats = await queries.getOutletDashboardStats();

    const outlets = [];
    const today = [];
    const yesterday = [];
    const week = [];
    const month = [];

    rawStats.forEach(row => {
      outlets.push(row.name);
      today.push(row.today);
      yesterday.push(row.yesterday);
      week.push(row.week);
      month.push(row.month);
    });

    res.status(200).json({
      success: true,
      data: {
        outlets,
        periodData: {
          today,
          yesterday,
          week,
          month
        }
      }
    });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  getAllOutlets,
  addOutlet,
  updateOutlet,
  updateOutletCredentials,
  toggleOutletStatus,
  deleteOutlet,
  addUserToOutlet,
  updateOutletUser,
  deleteOutletUser,
  toggleOutletUserStatus,
  getOutletDashboardStats
};
