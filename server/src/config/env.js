const path = require('path');

// Load server/.env first, fallback to cwd .env
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const FORBIDDEN_SECRETS = new Set([
  'replace_with_a_secure_random_64_character_hex_secret',
  'replace_with_a_secure_random_64_character_hex_secret_minimum_32_chars',
  'dev_ephemeral_jwt_secret_change_in_production_2026',
  'campushealth_jwt_super_secret_2026',
  'secret',
  'changeme'
]);

function validateEnv() {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || typeof jwtSecret !== 'string' || jwtSecret.trim().length < 32) {
    throw new Error(
      'FATAL SECURITY ERROR: JWT_SECRET environment variable is required and must be at least 32 characters long.'
    );
  }
  if (FORBIDDEN_SECRETS.has(jwtSecret.trim())) {
    throw new Error(
      'FATAL SECURITY ERROR: JWT_SECRET cannot use a known weak or template placeholder value.'
    );
  }
}

validateEnv();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const rawOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

if (process.env.VERCEL_URL) {
  rawOrigins.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  rawOrigins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
}
if (!rawOrigins.includes('https://medico-assist.vercel.app')) {
  rawOrigins.push('https://medico-assist.vercel.app');
}

module.exports = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv,
  isProduction,
  isTest: nodeEnv === 'test',
  jwtSecret: process.env.JWT_SECRET.trim(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtIssuer: 'medico-assist-api',
  jwtAudience: 'medico-assist-client',
  authCookieName: 'campushealth_token',
  csrfCookieName: 'XSRF-TOKEN',
  csrfHeaderName: 'x-csrf-token',
  allowedOrigins: rawOrigins,
  mongoUri: process.env.MONGO_URI || '',
  allowLocalJsonFallback: process.env.ALLOW_LOCAL_JSON_FALLBACK === 'true' && !isProduction,
  aiConfig: {
    apiKey: (process.env.AI_API_KEY || '').trim(),
    baseUrl: (process.env.AI_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/+$/, ''),
    model: (process.env.AI_MODEL || 'gpt-4o-mini').trim(),
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 15000
  }
};
