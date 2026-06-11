const express = require('express');
const jwt = require('jsonwebtoken');
const controller = require('./outletReportsController');
const { findAdminById, findUserById } = require('../loginControllers/authsqlc');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

/**
 * Unified authentication middleware that handles both admin and user tokens
 * and resolves their respective profiles from the database.
 */
const protectReport = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'You are not logged in. Please log in to access this resource.'
      });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user;
    let userType;
    
    if (decoded.type === 'admin') {
      user = await findAdminById(decoded.id);
      userType = 'admin';
    } else {
      user = await findUserById(decoded.id);
      userType = 'user';
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session is invalid or user no longer exists.'
      });
    }
    
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account is currently inactive. Please contact support.'
      });
    }
    
    req.user = user;
    req.userType = userType;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your login session has expired. Please log in again.'
      });
    }
    next(error);
  }
};

// Protect all report endpoints
router.use(protectReport);

// Register routes
router.get('/summary', controller.getSummary);
router.get('/order-analytics', controller.getOrderAnalytics);
router.get('/order-types', controller.getOrderTypes);
router.get('/payment-analytics', controller.getPaymentAnalytics);
router.get('/hourly-sales', controller.getHourlySales);
router.get('/category-sales', controller.getCategorySales);
router.get('/top-items', controller.getTopItems);
router.get('/kot-analytics', controller.getKotAnalytics);
router.get('/table-analytics', controller.getTableAnalytics);
router.get('/customer-analytics', controller.getCustomerAnalytics);
router.get('/recent-orders', controller.getRecentOrders);

module.exports = router;
