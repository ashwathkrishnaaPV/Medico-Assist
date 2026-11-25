const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively sanitizes strings and strips dangerous keys or Mongo/operator-like $-prefixed keys
 * from user-controlled objects to guard against NoSQL operator injection and prototype pollution.
 */
function stripControlChars(str) {
  let out = '';
  for (let i = 0; i < str.length; i += 1) {
    const code = str.charCodeAt(i);
    if (code === 0 || (code >= 1 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127) {
      continue;
    }
    out += str[i];
  }
  return out.trim();
}

function sanitizeValue(value, options = { allowDollarKeys: false }) {
  if (typeof value === 'string') {
    return stripControlChars(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, options));
  }

  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const cleanObj = {};
    for (const [key, val] of Object.entries(value)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      if (!options.allowDollarKeys && key.startsWith('$')) continue;
      if (!options.allowDollarKeys && key.includes('.')) {
        // Replace dotted keys to prevent nested dot-notation injection
        cleanObj[key.replace(/\./g, '_')] = sanitizeValue(val, options);
      } else {
        cleanObj[key] = sanitizeValue(val, options);
      }
    }
    return cleanObj;
  }

  return value;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params before validation.
 */
function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}

module.exports = {
  sanitizeValue,
  sanitizeRequest
};
