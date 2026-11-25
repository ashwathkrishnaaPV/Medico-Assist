const crypto = require('crypto');
const env = require('../config/env');
const { getCsrfCookieOptions } = require('../services/tokenService');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_EXEMPT_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/csrf-token'
]);

function timingSafeEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Ensures CSRF token cookie is issued on GET requests and verifies double-submit
 * header/cookie parity on state-changing requests authenticated via session cookie.
 */
function csrfProtection(req, res, next) {
  const cookies = req.cookies || {};
  let cookieToken = cookies[env.csrfCookieName];

  if (SAFE_METHODS.has(req.method)) {
    if (!cookieToken) {
      cookieToken = crypto.randomBytes(32).toString('hex');
      res.cookie(env.csrfCookieName, cookieToken, getCsrfCookieOptions());
    }
    return next();
  }

  const fullPath = `${req.baseUrl || ''}${req.path || ''}`;
  if (CSRF_EXEMPT_PATHS.has(fullPath) || CSRF_EXEMPT_PATHS.has(req.originalUrl?.split('?')[0])) {
    return next();
  }

  // Enforce CSRF check whenever session cookie authentication is present
  const hasAuthCookie = Boolean(cookies[env.authCookieName]);
  if (!hasAuthCookie) {
    return next();
  }

  const headerToken = req.headers[env.csrfHeaderName] || req.headers['x-xsrf-token'];
  if (!cookieToken || !headerToken || !timingSafeEquals(String(cookieToken), String(headerToken))) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_INVALID',
        message: 'Invalid or missing CSRF token.'
      }
    });
  }

  next();
}

module.exports = { csrfProtection };
