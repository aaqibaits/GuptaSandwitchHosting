const rateLimit = require('express-rate-limit');

// In-memory store for tracking failed login attempts by IP address
const failedAttempts = new Map();

// Helper to extract client IP address accurately
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || req.ip;
};

// Periodic garbage collection to prevent memory leaks from old composite key records
setInterval(() => {
  const now = Date.now();
  const expiryThreshold = 24 * 60 * 60 * 1000; // 24 hours
  for (const [key, data] of failedAttempts.entries()) {
    // If no active lockout and no recent activity in the last 24 hours, delete
    if ((!data.lockUntil || now > data.lockUntil) && (now - data.lastAttempt > expiryThreshold)) {
      failedAttempts.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

// ─── 1. Volumetric Limit for Auth Routes ─────────────────────────────────────
const authVolumetricLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests to authentication endpoints. Please try again after 15 minutes.'
  }
});

// ─── 2. Progressive Lockout for Login Failures ───────────────────────────────
const getLockDuration = (attempts) => {
  if (attempts >= 20) return 24 * 60 * 60 * 1000; // 24 hours (1 day)
  if (attempts >= 15) return 8 * 60 * 60 * 1000;  // 8 hours
  if (attempts >= 10) return 1 * 60 * 60 * 1000;  // 1 hour
  if (attempts >= 6) return 10 * 60 * 1000;       // 10 minutes
  return 0;
};

const formatRemainingTime = (ms) => {
  if (ms >= 60 * 60 * 1000) {
    const hours = Math.ceil(ms / (60 * 60 * 1000));
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  const minutes = Math.ceil(ms / (60 * 1000));
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};

const loginProgressiveLimiter = (req, res, next) => {
  const ip = getClientIp(req);
  const email = req.body?.email?.trim().toLowerCase() || 'unknown';
  const key = `${ip}:${email}`;
  const now = Date.now();
  const data = failedAttempts.get(key);

  // Check if IP + Email is currently locked out
  if (data && data.lockUntil && now < data.lockUntil) {
    const remaining = data.lockUntil - now;
    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts. Please wait ${formatRemainingTime(remaining)} before trying again.`
    });
  }

  // Intercept the Express response to check if authentication failed or succeeded
  const originalJson = res.json;
  res.json = function (body) {
    // Restore the original res.json function
    res.json = originalJson;

    if (body && body.success === true) {
      // On success, reset the failure counter for this specific IP + Email combination
      failedAttempts.delete(key);
    } else if (body && body.success === false && body.message === "Invalid credentials.") {
      // Increment failure count
      let currentData = failedAttempts.get(key) || { attempts: 0, lockUntil: null, lastAttempt: 0, lastPath: "" };
      
      // Prevent double-counting the dual admin + user login attempts fallback sequence
      const isDualLoginSequence = 
        req.path.endsWith('/user/login') && 
        currentData.lastPath && 
        currentData.lastPath.endsWith('/admin/login') && 
        (now - currentData.lastAttempt) < 2000;

      if (!isDualLoginSequence) {
        currentData.attempts += 1;
      }
      
      currentData.lastAttempt = now;
      currentData.lastPath = req.path;

      const duration = getLockDuration(currentData.attempts);
      if (duration > 0) {
        currentData.lockUntil = now + duration;
        // Inject lockout warning into the response body message
        body.message = `Invalid credentials. Too many failed attempts. Please wait ${formatRemainingTime(duration)} before trying again.`;
      }
      
      failedAttempts.set(key, currentData);
    }

    return originalJson.call(this, body);
  };

  next();
};

module.exports = {
  authVolumetricLimiter,
  loginProgressiveLimiter,
  // Exporting map for testing/debugging purposes
  failedAttempts
};
