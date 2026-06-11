const { pool } = require('../../config/database');

const getClient = (client) => client || pool;

// Get platform setup for a specific outlet
const getPlatformSetupByOutletId = async (outletId, client) => {
  const { rows } = await getClient(client).query(
    `SELECT outlet_id, access_token, swiggy_id, zomato_id, created_at, updated_at
     FROM outlet_integrations
     WHERE outlet_id = $1;`,
    [outletId]
  );
  return rows[0];
};

// Get all platform setups
const getAllPlatformSetups = async (client) => {
  const { rows } = await getClient(client).query(
    `SELECT oi.outlet_id, o.name AS outlet_name, oi.access_token, oi.swiggy_id, oi.zomato_id, oi.created_at, oi.updated_at
     FROM outlet_integrations oi
     JOIN outlets o ON oi.outlet_id = o.id
     ORDER BY o.name ASC;`
  );
  return rows;
};

// Upsert platform setup for an outlet
const upsertPlatformSetup = async (outletId, data, client) => {
  const { access_token, swiggy_id, zomato_id } = data;
  const { rows } = await getClient(client).query(
    `INSERT INTO outlet_integrations (outlet_id, access_token, swiggy_id, zomato_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (outlet_id) 
     DO UPDATE SET 
       access_token = EXCLUDED.access_token,
       swiggy_id = EXCLUDED.swiggy_id,
       zomato_id = EXCLUDED.zomato_id,
       updated_at = CURRENT_TIMESTAMP
     RETURNING outlet_id, access_token, swiggy_id, zomato_id, created_at, updated_at;`,
    [outletId, access_token, swiggy_id || null, zomato_id || null]
  );
  return rows[0];
};

// Delete platform setup for an outlet
const deletePlatformSetup = async (outletId, client) => {
  const { rowCount } = await getClient(client).query(
    `DELETE FROM outlet_integrations WHERE outlet_id = $1;`,
    [outletId]
  );
  return rowCount;
};

module.exports = {
  pool,
  getPlatformSetupByOutletId,
  getAllPlatformSetups,
  upsertPlatformSetup,
  deletePlatformSetup
};
