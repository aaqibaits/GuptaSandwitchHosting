const { pool } = require('../../config/database');

// Get all accounting entries, optionally filtered by outletId
const getAllLedgerEntries = async (outletId) => {
  let query;
  let params = [];
  if (outletId) {
    query = `
      SELECT a.*, o.name as outlet_name
      FROM accounting_ledger a
      LEFT JOIN outlets o ON a.outlet_id = o.id
      WHERE a.outlet_id = $1
      ORDER BY a.order_date DESC, a.id DESC
    `;
    params = [outletId];
  } 
  else {
    query = `
      SELECT a.*, o.name as outlet_name
      FROM accounting_ledger a
      LEFT JOIN outlets o ON a.outlet_id = o.id
      ORDER BY a.order_date DESC, a.id DESC
    `;
  }
  const { rows } = await pool.query(query, params);
  return rows;
};

// Get single entry by ID
const getLedgerEntryById = async (id) => {
  const query = `
    SELECT a.*, o.name as outlet_name
    FROM accounting_ledger a
    LEFT JOIN outlets o ON a.outlet_id = o.id
    WHERE a.id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

// Get summary stats (total billed, received, pending)
const getSummaryStats = async (outletId) => {
  let query;
  let params = [];
  if (outletId) {
    query = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_billed,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as received,
        COALESCE(SUM(CASE WHEN status IN ('pending','due') THEN amount ELSE 0 END), 0) as pending
      FROM accounting_ledger
      WHERE outlet_id = $1
    `;
    params = [outletId];
  } else {
    query = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_billed,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as received,
        COALESCE(SUM(CASE WHEN status IN ('pending','due') THEN amount ELSE 0 END), 0) as pending
      FROM accounting_ledger
    `;
  }
  const { rows } = await pool.query(query, params);
  return rows[0];
};

// Create a new accounting entry
// ✅ FIX: was `bill_url = null, bill_url = null` (duplicate key — SyntaxError).
//    Updated to handle only the bill_url column.
const createLedgerEntry = async (data) => {
  const {
    outlet_id, transaction_id, amount, order_date,
    delivery_date, payment_date, bill_uploaded = false,
    status = 'pending', bill_url = null
  } = data;

  const { rows } = await pool.query(
    `INSERT INTO accounting_ledger
       (outlet_id, transaction_id, amount, order_date, delivery_date,
        payment_date, bill_uploaded, status, bill_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [outlet_id, transaction_id, amount, order_date, delivery_date,
     payment_date, bill_uploaded, status, bill_url]
  );
  return rows[0];
};

// Update an existing entry
// ✅ FIX: was destructuring `bill_url` twice and setting `bill_url = $10` in SQL.
//    Updated to handle only bill_url and avoid bill_image references.
const updateLedgerEntry = async (id, data) => {
  const {
    outlet_id, transaction_id, amount, order_date,
    delivery_date, payment_date, status, bill_url, bill_uploaded
  } = data;

  const { rows } = await pool.query(
    `UPDATE accounting_ledger
     SET outlet_id = $1, transaction_id = $2, amount = $3, order_date = $4,
         delivery_date = $5, payment_date = $6, status = $7,
         bill_url = $8, bill_uploaded = $9,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING *`,
    [outlet_id, transaction_id, amount, order_date, delivery_date,
     payment_date, status, bill_url, bill_uploaded, id]
  );
  return rows[0];
};

// Update bill_uploaded flag and bill_url path
// ✅ FIX: was `bill_url = $1, bill_url = $1` (duplicate SET clause — SQL error).
//    Updated to set only bill_url.
const updateBillUpload = async (id, imagePath) => {
  const { rows } = await pool.query(
    `UPDATE accounting_ledger
     SET bill_uploaded = true, bill_url = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [imagePath, id]
  );
  return rows[0];
};

// Update payment date and status
const updatePayment = async (id, payment_date, status = 'paid') => {
  const { rows } = await pool.query(
    `UPDATE accounting_ledger
     SET payment_date = $1, status = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [payment_date, status, id]
  );
  return rows[0];
};

// Delete entry
const deleteLedgerEntry = async (id) => {
  await pool.query(`DELETE FROM accounting_ledger WHERE id = $1`, [id]);
};

// Get all outlets (for dropdown in form)
const getAllOutlets = async () => {
  const { rows } = await pool.query(`SELECT id, name FROM outlets ORDER BY name`);
  return rows;
};

module.exports = {
  getAllLedgerEntries,
  getLedgerEntryById,
  getSummaryStats,
  createLedgerEntry,
  updateLedgerEntry,
  updateBillUpload,
  updatePayment,
  deleteLedgerEntry,
  getAllOutlets,
};