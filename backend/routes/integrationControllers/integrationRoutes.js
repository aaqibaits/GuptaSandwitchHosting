const express = require('express');
const router = express.Router();
const controller = require('./integrationController');

// Middleware to validate the third-party Dyno API Access Token
const validateDynoToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['x-dyno-token'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  const expectedToken = process.env.DYNO_ACCESS_KEY;
  if (!expectedToken || token !== expectedToken) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing Dyno access token'
    });
  }
  next();
};

router.use(validateDynoToken);

router.post('/swiggy/order', controller.swiggyWebhook);
router.post('/zomato/order', controller.zomatoWebhook);

module.exports = router;

