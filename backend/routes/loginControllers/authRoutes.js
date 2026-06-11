// routes/authRoutes.js
const express = require("express");
const {
  loginAdmin,
  loginUser,
  me,
  logout,
} = require("./authControllers");
const { protect } = require("../../middleware/authMiddleware");
const { authVolumetricLimiter, loginProgressiveLimiter } = require("../../middleware/loginRateLimiter");
const validate = require("../../middleware/validate");
const { loginSchema } = require("../../validation/authValidation");

const router = express.Router();

// Apply volumetric limit to all auth endpoints
router.use(authVolumetricLimiter);

// Public (with progressive failed attempts lockout)
router.post("/admin/login", validate(loginSchema), loginProgressiveLimiter, loginAdmin);
router.post("/user/login", validate(loginSchema), loginProgressiveLimiter, loginUser);

// Protected (requires valid JWT via authMiddleware)
router.get("/me", protect(), me);
router.post("/logout", protect(), logout);

module.exports = router;