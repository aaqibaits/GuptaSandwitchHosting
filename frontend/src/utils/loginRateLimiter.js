const STORAGE_KEY_PREFIX = 'gs_login_attempts_';

const getLockDuration = (attempts) => {
  if (attempts >= 20) return 24 * 60 * 60 * 1000; // 24 hours (1 day)
  if (attempts >= 15) return 8 * 60 * 60 * 1000;  // 8 hours
  if (attempts >= 10) return 1 * 60 * 60 * 1000;  // 1 hour
  if (attempts >= 6) return 10 * 60 * 1000;       // 10 minutes
  return 0;
};

/**
 * Checks if the given email is currently locked out locally.
 * Returns the lock state and remaining milliseconds.
 */
export const checkLockout = (email) => {
  if (!email) return { locked: false, remaining: 0 };
  const key = `${STORAGE_KEY_PREFIX}${email.trim().toLowerCase()}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { locked: false, remaining: 0 };

    const data = JSON.parse(raw);
    if (data.lockUntil) {
      const now = Date.now();
      if (now < data.lockUntil) {
        return { locked: true, remaining: data.lockUntil - now };
      }
    }
  } catch (e) {
    console.error('Error reading login lockout from localStorage:', e);
  }
  return { locked: false, remaining: 0 };
};

/**
 * Increments the failed login attempt counter and sets lockout timestamp if threshold is reached.
 */
export const recordFailure = (email) => {
  if (!email) return;
  const key = `${STORAGE_KEY_PREFIX}${email.trim().toLowerCase()}`;
  try {
    const now = Date.now();
    const raw = localStorage.getItem(key);
    let data = { attempts: 0, lockUntil: null, lastAttempt: now };
    
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (err) {
        // use default
      }
    }

    data.attempts = (data.attempts || 0) + 1;
    data.lastAttempt = now;
    
    const duration = getLockDuration(data.attempts);
    if (duration > 0) {
      data.lockUntil = now + duration;
    } else {
      data.lockUntil = null;
    }

    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving login failure to localStorage:', e);
  }
};

/**
 * Synchronizes local lockout status based on server-side instructions (e.g. on HTTP 429 response)
 */
export const syncLockout = (email, durationMs) => {
  if (!email || !durationMs) return;
  const key = `${STORAGE_KEY_PREFIX}${email.trim().toLowerCase()}`;
  try {
    const now = Date.now();
    const raw = localStorage.getItem(key);
    let data = { attempts: 6, lockUntil: now + durationMs, lastAttempt: now };
    
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (err) {
        // use default
      }
      data.lockUntil = now + durationMs;
      data.lastAttempt = now;
      if (!data.attempts || data.attempts < 6) {
        data.attempts = 6;
      }
    }
    
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error syncing login lockout with server:', e);
  }
};

/**
 * Clears failed attempt counts for an email (run upon successful login)
 */
export const clearAttempts = (email) => {
  if (!email) return;
  const key = `${STORAGE_KEY_PREFIX}${email.trim().toLowerCase()}`;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Error clearing login attempts from localStorage:', e);
  }
};
