const express = require('express');
const router = express.Router();
const controller = require('./auditLogsController');
const { protect } = require('../../middleware/authMiddleware');

// Protected audit logs retrieval route (restricts to admin token types)
router.get('/', protect('admin'), controller.fetchLogs);

module.exports = router;
