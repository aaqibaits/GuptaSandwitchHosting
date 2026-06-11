const express = require('express');
const router = express.Router();
const outletController = require('./outletcontroller');
const validate = require('../../middleware/validate');
const { protect } = require('../../middleware/authMiddleware');
const {
  addOutletSchema,
  updateOutletSchema,
  updateOutletCredsSchema,
  addUserSchema,
  updateUserSchema
} = require('../../validation/outletValidation');

// Secure all endpoints under /api/outlets to require admin privileges
router.use(protect('admin'));

// Outlets endpoints
router.get('/', outletController.getAllOutlets);
router.get('/dashboard/stats', outletController.getOutletDashboardStats);
router.post('/add-outlet', validate(addOutletSchema), outletController.addOutlet);
router.put('/:id', validate(updateOutletSchema), outletController.updateOutlet);
router.put('/:id/credentials', validate(updateOutletCredsSchema), outletController.updateOutletCredentials);
router.delete('/:id', outletController.deleteOutlet);
router.put('/:id/status', outletController.toggleOutletStatus);

// Staff Users endpoints under outlets
router.post('/:id/users', validate(addUserSchema), outletController.addUserToOutlet);
router.put('/:id/users/:userId', validate(updateUserSchema), outletController.updateOutletUser);
router.delete('/:id/users/:userId', outletController.deleteOutletUser);
router.put('/:id/users/:userId/status', outletController.toggleOutletUserStatus);

module.exports = router;