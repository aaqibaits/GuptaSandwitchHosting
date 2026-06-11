// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  findAdminByEmail,
  findAdminByUsername,
  findUserByEmail,
  findUserByUsername,
  updateAdminLastLogin,
  insertSession,
  logoutSession,
} = require("./authsqlc");
const { logActivity } = require("../../utils/auditLogger");

// ─── Helpers ─────────────────────────────────────────────────────────────────

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

/** Strip sensitive fields before sending admin data to the client. */
const safeAdminResponse = (admin) => ({
  id: admin.id,
  uuid: admin.uuid,
  name: admin.name,
  email: admin.email,
  username: admin.username,
  phone: admin.phone,
  role: admin.role,
  is_super_admin: admin.is_super_admin,
  permissions: admin.permissions,
  status: admin.status,
});

/** Strip sensitive fields before sending user data to the client. */
const safeUserResponse = (user) => ({
  id: user.id,
  uuid: user.uuid,
  outlet_id: user.outlet_id,
  outlet_name: user.outlet_name ?? null,
  name: user.name,
  email: user.email,
  username: user.username,
  role_label: user.role_label,
  app_role: user.app_role,
  permissions: user.permissions,
  status: user.status,
});

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 * Authenticates a row from the `admin` table.
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const trimmedInput = email.trim();
    let admin = null;
    if (trimmedInput.includes("@")) {
      admin = await findAdminByEmail(trimmedInput);
    } else {
      admin = await findAdminByUsername(trimmedInput);
    }

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    if (admin.status !== "active") {
      return res
        .status(401)
        .json({ success: false, message: "Your account is inactive." });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const token = signToken({
      id: admin.id,
      type: "admin",
      role: admin.role,
      is_super_admin: admin.is_super_admin,
    });

    await updateAdminLastLogin(admin.id);

    await logActivity({
      req,
      action: "ADMIN_LOGIN_SUCCESS",
      entityType: "admin",
      entityId: admin.id,
      adminId: admin.id,
      newValues: { email: admin.email, username: admin.username }
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
      user: safeAdminResponse(admin),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during admin login.",
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/user/login
 * Authenticates a row from the `users` table and creates a session record.
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const trimmedInput = email.trim();
    let user = null;
    if (trimmedInput.includes("@")) {
      user = await findUserByEmail(trimmedInput);
    } else {
      user = await findUserByUsername(trimmedInput);
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    if (user.status !== "active") {
      return res
        .status(401)
        .json({ success: false, message: "Your account is inactive." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const token = signToken({
      id: user.id,
      type: "user",
      outlet_id: user.outlet_id,
      app_role: user.app_role,
      role_label: user.role_label,
    });

    // Persist the session so we can invalidate it on logout.
    await insertSession({
      user_id: user.id,
      outlet_id: user.outlet_id,
      token,
      ip_address: req.ip,
      user_agent: req.headers["user-agent"] || null,
    });

    await logActivity({
      req,
      action: "USER_LOGIN_SUCCESS",
      entityType: "user",
      entityId: user.id,
      userId: user.id,
      outletId: user.outlet_id,
      newValues: { email: user.email, username: user.username, outlet_id: user.outlet_id }
    });

    return res.status(200).json({
      success: true,
      message: "User login successful.",
      token,
      user: safeUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during user login.",
      error: error.message,
    });
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user/admin (populated by authMiddleware).
 */
const me = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      userType: req.userType,
      user: req.user,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error.", error: error.message });
  }
};

/**
 * POST /api/auth/logout
 * Marks the current JWT session as logged out in the sessions table.
 * Admin logouts are stateless (no session row), so the query is a no-op for them.
 */
const logout = async (req, res) => {
  try {
    const token = req.token;

    if (token) {
      await logoutSession(token);
    }

    if (req.user) {
      await logActivity({
        req,
        action: req.userType === "admin" ? "ADMIN_LOGOUT" : "USER_LOGOUT",
        entityType: req.userType,
        entityId: req.user.id,
        userId: req.userType === "user" ? req.user.id : null,
        adminId: req.userType === "admin" ? req.user.id : null,
        outletId: req.userType === "user" ? (req.user.outlet_id || req.user.outletId) : null
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during logout.",
      error: error.message,
    });
  }
};

module.exports = { loginAdmin, loginUser, me, logout };