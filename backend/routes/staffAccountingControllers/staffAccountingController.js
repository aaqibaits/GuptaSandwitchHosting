const {
  getStaffLedgerEntries,
  getStaffSummaryStats
} = require('./staffAccountingSqlc');

const getStaffAccountingLedger = async (req, res) => {
  try {
    const outletId = req.user.outlet_id;
    if (!outletId) {
      return res.status(400).json({ success: false, message: 'User does not belong to any outlet' });
    }
    const ledger = await getStaffLedgerEntries(outletId);
    res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    console.error('getStaffAccountingLedger error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStaffSummary = async (req, res) => {
  try {
    const outletId = req.user.outlet_id;
    if (!outletId) {
      return res.status(400).json({ success: false, message: 'User does not belong to any outlet' });
    }
    const summary = await getStaffSummaryStats(outletId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error('getStaffSummary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStaffAccountingLedger,
  getStaffSummary
};
