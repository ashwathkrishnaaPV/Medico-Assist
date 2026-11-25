const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Map<normalizedIdentifier, { count: number, firstFailedAt: number, lockedUntil: number }>
const failedAttempts = new Map();

function normalizeKey(identifier) {
  return String(identifier || '').trim().toLowerCase();
}

function checkLockout(identifier) {
  const key = normalizeKey(identifier);
  if (!key) return { locked: false };
  const record = failedAttempts.get(key);
  if (!record) return { locked: false };

  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { locked: true, remainingSeconds };
  }

  if (now - record.firstFailedAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.delete(key);
    return { locked: false };
  }

  return { locked: false };
}

function recordFailedAttempt(identifier) {
  const key = normalizeKey(identifier);
  if (!key) return;
  const now = Date.now();
  const existing = failedAttempts.get(key);

  if (!existing || now - existing.firstFailedAt > LOCKOUT_WINDOW_MS) {
    failedAttempts.set(key, { count: 1, firstFailedAt: now, lockedUntil: 0 });
    return;
  }

  const nextCount = existing.count + 1;
  const lockedUntil = nextCount >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_WINDOW_MS : 0;
  failedAttempts.set(key, { count: nextCount, firstFailedAt: existing.firstFailedAt, lockedUntil });
}

function clearFailedAttempts(identifier) {
  const key = normalizeKey(identifier);
  if (key) failedAttempts.delete(key);
}

function resetAllForTesting() {
  failedAttempts.clear();
}

module.exports = {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_WINDOW_MS,
  checkLockout,
  recordFailedAttempt,
  clearFailedAttempts,
  resetAllForTesting
};
