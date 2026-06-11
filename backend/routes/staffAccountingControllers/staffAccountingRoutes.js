const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  getStaffAccountingLedger,
  getStaffSummary
} = require('./staffAccountingController');

// All staff accounting routes require authentication
router.use(protect());

router.get('/', getStaffAccountingLedger);
router.get('/summary', getStaffSummary);

module.exports = router;
