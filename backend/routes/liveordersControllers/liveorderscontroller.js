const queries = require('./liveordersqlc');
const pool = queries.pool;
const { logActivity } = require('../../utils/auditLogger');
const Joi = require('joi');

const sendError = (res, error, status = 500) => {
  console.error('Live Orders Controller Error:', error);
  res.status(status).json({
    success: false,
    message: error.message || 'An error occurred on the server.'
  });
};

const platformSetupSchema = Joi.object({
  access_token: Joi.string().min(1).max(255).required().messages({
    'any.required': 'Access Token is required.',
    'string.empty': 'Access Token cannot be empty.'
  }),
  swiggy_id: Joi.string().max(100).allow(null, '').optional(),
  zomato_id: Joi.string().max(100).allow(null, '').optional()
});

// GET platform setup for a specific outlet
const getPlatformSetup = async (req, res) => {
  const { outletId } = req.params;
  try {
    const setup = await queries.getPlatformSetupByOutletId(outletId);
    if (!setup) {
      return res.status(404).json({
        success: false,
        message: 'Platform setup details not found for this outlet.'
      });
    }
    res.status(200).json({
      success: true,
      data: setup
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET all platform setups
const getAllPlatformSetups = async (req, res) => {
  try {
    const setups = await queries.getAllPlatformSetups();
    res.status(200).json({
      success: true,
      data: setups
    });
  } catch (error) {
    sendError(res, error);
  }
};

// UPDATE/UPSERT platform setup for an outlet
const updatePlatformSetup = async (req, res) => {
  const { outletId } = req.params;
  const { error, value } = platformSetupSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify outlet exists
    const { rows: outletRows } = await client.query('SELECT id, name FROM outlets WHERE id = $1', [outletId]);
    if (outletRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Outlet not found.'
      });
    }

    // Get old setup for audit logging if exists
    const oldSetup = await queries.getPlatformSetupByOutletId(outletId, client);

    // Perform upsert
    const updatedSetup = await queries.upsertPlatformSetup(outletId, value, client);

    await client.query('COMMIT');

    logActivity({
      req,
      action: 'PLATFORM_SETUP_UPDATE',
      entityType: 'outlet_integrations',
      entityId: outletId,
      outletId: outletId,
      oldValues: oldSetup || null,
      newValues: updatedSetup
    });

    res.status(200).json({
      success: true,
      message: 'Platform setup updated successfully.',
      data: updatedSetup
    });
  } catch (error) {
    await client.query('ROLLBACK');
    sendError(res, error);
  } finally {
    client.release();
  }
};

// DELETE platform setup for an outlet
const deletePlatformSetup = async (req, res) => {
  const { outletId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const oldSetup = await queries.getPlatformSetupByOutletId(outletId, client);
    if (!oldSetup) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Platform setup not found.'
      });
    }

    await queries.deletePlatformSetup(outletId, client);

    await client.query('COMMIT');

    logActivity({
      req,
      action: 'PLATFORM_SETUP_DELETE',
      entityType: 'outlet_integrations',
      entityId: outletId,
      outletId: outletId,
      oldValues: oldSetup
    });

    res.status(200).json({
      success: true,
      message: 'Platform setup deleted successfully.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    sendError(res, error);
  } finally {
    client.release();
  }
};

module.exports = {
  getPlatformSetup,
  getAllPlatformSetups,
  updatePlatformSetup,
  deletePlatformSetup
};
