const express = require('express');
const router = express.Router();
const controller = require('./liveorderscontroller');
const { protect } = require('../../middleware/authMiddleware');

// Secure all endpoints under /api/live-orders (or wherever this is registered) to require admin privileges
router.use(protect('admin'));

router.get('/', controller.getAllPlatformSetups);
router.get('/:outletId', controller.getPlatformSetup);
router.put('/:outletId', controller.updatePlatformSetup);
router.delete('/:outletId', controller.deletePlatformSetup);

module.exports = router;
