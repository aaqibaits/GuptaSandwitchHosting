const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../../middleware/authMiddleware');
// ✅ FIX: was `require('./accountingController')` (lowercase 'a') — on Linux (case-sensitive
//    filesystem) this throws MODULE_NOT_FOUND because the actual file is AccountingController.js.
const {
  getAccountingLedger,
  getSummary,
  getOutletsList,
  getLedgerEntry,
  addLedgerEntry,
  editLedgerEntry,
  markBillUploaded,
  recordPayment,
  removeLedgerEntry,
} = require('./accountingController');

// Ensure the upload directory exists before multer tries to write into it.
// Without this the first file upload throws ENOENT.
const uploadDir = path.join(process.cwd(), 'uploads', 'accounting');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for bill image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bill-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// All routes require authentication
router.use(protect());

// GET endpoints
router.get('/', getAccountingLedger);
router.get('/summary', getSummary);
router.get('/outlets', getOutletsList);
router.get('/:id', getLedgerEntry);

// POST / PUT with file upload
router.post('/', upload.single('bill_url'), addLedgerEntry);
router.put('/:id', upload.single('bill_url'), editLedgerEntry);
router.put('/:id/bill', upload.single('bill_url'), markBillUploaded);
router.put('/:id/payment', recordPayment);
router.delete('/:id', removeLedgerEntry);

module.exports = router;