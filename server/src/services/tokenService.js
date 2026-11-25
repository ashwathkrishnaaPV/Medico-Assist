const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

// Map<jti, expiresAtMs> for explicit token revocation on logout / password change
const revokedJtis = new Map();

function pruneRevokedTokens() {
  const now = Date.now();
  for (const [jti, expMs] of revokedJtis.entries()) {
    if (expMs <= now) {
      revokedJtis.delete(jti);
    }
  }
}

function revokeToken(decoded) {
  if (!decoded || !decoded.jti) return;
  pruneRevokedTokens();
  const expMs = decoded.exp ? decoded.exp * 1000 : Date.now() + 2 * 60 * 60 * 1000;
  revokedJtis.set(decoded.jti, expMs);
}

function isTokenRevoked(jti) {
  if (!jti) return false;
  pruneRevokedTokens();
  const expMs = revokedJtis.get(jti);
  return Boolean(expMs && expMs > Date.now());
}

function signAuthToken(user) {
  const jti = crypto.randomUUID();
  const payload = {
    id: String(user._id || user.id),
    role: user.role,
    email: user.email,
    studentId: user.studentId || undefined,
    staffId: user.staffId || undefined,
    name: user.name,
    tv: Number(user.tokenVersion || 0),
    jti
  };

  return jwt.sign(payload, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  });
}

function verifyAuthToken(token) {
  const decoded = jwt.verify(token, env.jwtSecret, {
    algorithms: ['HS256'],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience
  });

  if (isTokenRevoked(decoded.jti)) {
    const err = new Error('Token has been revoked');
    err.code = 'TOKEN_REVOKED';
    throw err;
  }

  return decoded;
}

function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    maxAge: 60 * 60 * 1000, // 1 hour matching JWT expiry
    path: '/'
  };
}

function getCsrfCookieOptions() {
  return {
    httpOnly: false, // Must be readable by Axios same-origin to send X-CSRF-TOKEN header
    sameSite: 'lax',
    secure: env.isProduction,
    maxAge: 60 * 60 * 1000,
    path: '/'
  };
}

function setSessionCookies(res, token) {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie(env.authCookieName, token, getAuthCookieOptions());
  res.cookie(env.csrfCookieName, csrfToken, getCsrfCookieOptions());
  return csrfToken;
}

function clearSessionCookies(res) {
  res.clearCookie(env.authCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/'
  });
  res.clearCookie(env.csrfCookieName, {
    httpOnly: false,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/'
  });
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
  revokeToken,
  isTokenRevoked,
  setSessionCookies,
  clearSessionCookies,
  getAuthCookieOptions,
  getCsrfCookieOptions
};
