# Gupta Sandwich API Security Implementation Log

This document summarizes the comprehensive security enhancements implemented on the backend and frontend to secure the APIs, protect client operations, and log administrative and technical actions.

---

## 1. Volumetric & Progressive Lockout Rate Limiting

We implemented a dual-layer rate limiter protecting auth routes against brute-force, dictionary, and DDoS attacks.

### Backend Configurations
- **Volumetric Rate Limiter (`loginRateLimiter.js`)**: 
  - Restricts access to all `/api/auth` endpoints to a maximum of 100 requests per 15 minutes per IP address.
- **Progressive Lockout Limiter**:
  - Composite Key Scoping: Identifies client traffic using a composite of **IP + Email Address** (Option B). This ensures only a specific email gets locked out on a machine, allowing other valid credentials or users sharing the same Wi-Fi network/gateway IP to log in freely.
  - Progressive Penalty Tiers:
    - **6 failures**: 10-minute lockout.
    - **10 failures**: 1-hour lockout.
    - **15 failures**: 8-hour lockout.
    - **20+ failures**: 24-hour lockout.
  - Dual-Login Sequence Deduplication: Intercepts sequential POSTs to `/admin/login` and `/user/login` (triggered automatically by the frontend) and only increments the failure counter once within a 2-second window to prevent double-counting.
  - Garbage Collection: Runs a background interval every hour to prune stale memory entries and prevent leaks.

### Frontend Synchronization
- **Local Storage Tracker (`loginRateLimiter.js`)**: Keeps client-side counters synced.
- **Dynamic Lockout Countdown**: Prevents form submissions, disables the submit button, and displays a live countdown timer showing the remaining lockout time (e.g. `Locked (9m 45s)`).

---

## 2. Input Validation & Mass Assignment Sanitization (Joi)

We established a backend payload validation system to reject malicious, malformed, or dirty data before it reaches database layers.

### Backend Validation Middleware (`validate.js`)
- Validates request payloads (body, query, or params) against structural Joi schemas.
- **Mass Assignment Protection**: Enabled `stripUnknown: true`. Any unexpected properties sent in the request body (such as trying to overwrite role privileges, admin status, or IDs) are stripped out automatically before controller processing.
- Structured Error Maps: Returns a JSON mapping of invalid fields (e.g., `{"phone": "Please provide a valid 10-digit number."}`) so the frontend can display inline alerts.

### Schema Coverage
- **Auth**: `loginSchema` (validates emails and require passwords).
- **Outlets**: `addOutletSchema`, `updateOutletSchema`, `updateOutletCredsSchema` (restricting usernames, phone lengths, and emails).
- **Users**: `addUserSchema` and `updateUserSchema` (ensures staff roles, permissions lists, and active toggles are structured correctly).
- **Dishes**: `createDishSchema` and `updateDishSchema` (restricts prices to non-negative floats).

### Frontend Inline Integration
- Input borders highlight red (`.form-input--error`) with inline validation text underneath.
- General validation summary banners display at the top of modals.

---

## 3. Helmet HTTP Headers Security

Integrated `helmet` middleware in `server.js` with strict configurations:
- **XSS & Data Injection Prevention (CSP)**: A strict `Content-Security-Policy` limits resource domains.
- **Clickjacking Protection**: Configured `X-Frame-Options: DENY` (`frameguard: { action: "deny" }`) to prevent clickjacking/iframe embedding.
- **MIME Attacks**: Enabled `X-Content-Type-Options: nosniff` to enforce strict browser MIME type styling.
- **CORP (Cross-Origin Resource Policy)**: Set to `cross-origin` to allow the React app (on port 3000) to fetch static uploaded dish images from the Express server.

---

## 4. Persistent Database Audit Logging

A permanent logging mechanism records all business-level write, edit, delete, and session events in the database's `activity_logs` table.

### Logging Utility (`auditLogger.js`)
- Captures client IP, actor (admin/user ID, outlet), action code, entity class, and target record ID.
- **JWT Recovery Fallbacks**: Extracts caller identity directly from `req.headers.authorization`. If signature verification fails (e.g. key expiration), it falls back to `jwt.decode` to parse identity safely.
- **Parameter Fallbacks**: Extracts `outlet_id` and `user_id` from body/query variables (e.g., `createdBy` during POS checkout or logins) if the token is not set yet.
- Records `oldValues` and `newValues` as JSON payloads to track data history and state diffs.

### Integrated Triggers
- **Authentication**: `ADMIN_LOGIN_SUCCESS`, `USER_LOGIN_SUCCESS`, `ADMIN_LOGOUT`, `USER_LOGOUT`.
- **Outlets & Users**: creations, details updates, credential updates, status toggles, and deletions.
- **Dishes**: creations, updates (retaining pre-edit details), deletions (retaining pre-deleted details).
- **POS**: order creations (recording items, quantities, and totals).

---

## 5. Morgan Request Logging

Configured low-level technical logging on the backend using Morgan:
- A custom token extracts clean client IPs by stripping IPv6 loopback mapping headers (`::ffff:`).
- Custom logging format outputs: `:client-ip - :method :url :status :response-time ms`.
- Logs every HTTP request (including failed and unauthorized requests) for security tracing.

---

## 6. Unified Dynamic API Protection Middleware

We secured all routes using a central authentication gateway:
- **Unified `protect(allowedType)` middleware**: Resolves profiles dynamically by checking the token payload type (routing to `admin` or `users` tables).
- **Outlets**: Secured globally (`protect('admin')`) to restrict outlet and staff user configurations strictly to admins.
- **POS Checkout & KOTs**: Secured globally (`protect()`) to restrict actions to authenticated outlet staff or admins.
- **Dishes Catalog**: Secured catalog queries (`protect()`) for all staff/admins, and restricted catalog additions, edits, and deletions strictly to admins (`protect('admin')`).
- **Reports**: Secured globally (`protect()`) to restrict report requests to authenticated accounts.
