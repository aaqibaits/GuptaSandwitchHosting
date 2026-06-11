const { pool } = require('../../config/database');

const getStaffLedgerEntries = async (outletId) => {
  const query = `
    SELECT a.*, o.name as outlet_name
    FROM accounting_ledger a
    LEFT JOIN outlets o ON a.outlet_id = o.id
    WHERE a.outlet_id = $1
    ORDER BY a.order_date DESC, a.id DESC
  `;
  const { rows } = await pool.query(query, [outletId]);
  return rows;
};

const getStaffSummaryStats = async (outletId) => {
  const query = `
    SELECT 
      COALESCE(SUM(amount), 0) as total_billed,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as received,
      COALESCE(SUM(CASE WHEN status IN ('pending','due') THEN amount ELSE 0 END), 0) as pending
    FROM accounting_ledger
    WHERE outlet_id = $1
  `;
  const { rows } = await pool.query(query, [outletId]);
  return rows[0];
};

module.exports = {
  getStaffLedgerEntries,
  getStaffSummaryStats
};
