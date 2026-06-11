const express = require('express');
const controller = require('./POScontroller');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Secure all POS routes to require valid login session (admin or staff)
router.use(protect());

// Menu & categories
router.get('/categories', controller.getCategories);
router.get('/dishes', controller.getDishes);
router.get('/dishes/available', controller.getAvailableDishes);
router.get('/dishes/search', controller.searchDishes);
router.get('/categories/:categoryId/dishes', controller.getDishesByCategory);

// Orders
router.post('/orders', controller.createOrder);
router.get('/orders/:orderId', controller.getOrderById);
router.post('/orders/:orderId/cancel', controller.cancelOrder);

// KOT management
router.get('/kots', controller.getAllKots);
router.get('/kots/pending', controller.getPendingKots);
router.get('/kots/ready', controller.getReadyKots);
router.patch('/kots/:kotId/items/:itemId/ready', controller.markItemReady);
router.patch('/kots/:kotId/ready', controller.markAllItemsReady);
router.post('/kots/:kotId/dispatch', controller.dispatchOrder);
router.patch('/kots/:kotId/status', controller.updateKotStatus);

// Dashboard
router.get('/dashboard/stats', controller.getDashboardStats);

module.exports = router;
