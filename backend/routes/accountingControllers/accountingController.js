const {
  getAllLedgerEntries,
  getLedgerEntryById,
  getSummaryStats,
  createLedgerEntry,
  updateLedgerEntry,
  updateBillUpload,
  updatePayment,
  deleteLedgerEntry,
  getAllOutlets,
} = require('./accountingSqlc');

// GET /api/accounting
const getAccountingLedger = async (req, res) => {
  try {
    const outletId = req.query.outletId ? Number(req.query.outletId) : undefined;
    const ledger = await getAllLedgerEntries(outletId);
    res.status(200).json({ success: true, data: ledger });
  } catch (error) {
    console.error('getAccountingLedger error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/accounting/summary
const getSummary = async (req, res) => {
  try {
    const outletId = req.query.outletId ? Number(req.query.outletId) : undefined;
    const summary = await getSummaryStats(outletId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error('getSummary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/accounting/outlets
const getOutletsList = async (req, res) => {
  try {
    const outlets = await getAllOutlets();
    res.status(200).json({ success: true, data: outlets });
  } catch (error) {
    console.error('getOutletsList error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/accounting/:id
const getLedgerEntry = async (req, res) => {
  try {
    const entry = await getLedgerEntryById(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    console.error('getLedgerEntry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/accounting
const addLedgerEntry = async (req, res) => {
  try {
    const {
      outlet_id, transaction_id, amount, order_date,
      delivery_date, payment_date, status
    } = req.body;

    if (!outlet_id || !transaction_id || !amount || !order_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let bill_url = null;
    if (req.file) {
      bill_url = `/uploads/accounting/${req.file.filename}`;
    }

    const newEntry = await createLedgerEntry({
      outlet_id, transaction_id, amount, order_date,
      delivery_date: delivery_date || null,
      payment_date: payment_date || null,
      status: status || 'pending',
      bill_url,
      bill_uploaded: !!req.file
    });
    res.status(201).json({ success: true, data: newEntry });
  } catch (error) {
    console.error('addLedgerEntry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/accounting/:id
const editLedgerEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      outlet_id, transaction_id, amount, order_date,
      delivery_date, payment_date, status
    } = req.body;

    const existing = await getLedgerEntryById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    let bill_url = existing.bill_url;
    let bill_uploaded = existing.bill_uploaded;
    if (req.file) {
      bill_url = `/uploads/accounting/${req.file.filename}`;
      bill_uploaded = true;
    }

    const updated = await updateLedgerEntry(id, {
      outlet_id, transaction_id, amount, order_date,
      delivery_date: delivery_date || null,
      payment_date: payment_date || null,
      status: status || 'pending',
      bill_url,
      bill_uploaded
    });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('editLedgerEntry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/accounting/:id/bill
const markBillUploaded = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const imagePath = `/uploads/accounting/${req.file.filename}`;
    const updated = await updateBillUpload(id, imagePath);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('markBillUploaded error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/accounting/:id/payment
const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_date } = req.body;
    if (!payment_date) {
      return res.status(400).json({ success: false, message: 'payment_date required' });
    }
    const updated = await updatePayment(id, payment_date, 'paid');
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('recordPayment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/accounting/:id
const removeLedgerEntry = async (req, res) => {
  try {
    await deleteLedgerEntry(req.params.id);
    res.status(200).json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    console.error('removeLedgerEntry error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAccountingLedger,
  getSummary,
  getOutletsList,
  getLedgerEntry,
  addLedgerEntry,
  editLedgerEntry,
  markBillUploaded,
  recordPayment,
  removeLedgerEntry,
};