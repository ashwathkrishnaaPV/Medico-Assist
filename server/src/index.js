const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const { connectDB } = require('./db');
const { apiLimiter } = require('./middleware/rateLimiter');
const { sanitizeRequest } = require('./utils/sanitize');
const { csrfProtection } = require('./middleware/csrf');

function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // Allow Vercel preview & production deployments for this project
  if (/^https:\/\/medico-assist(-[a-z0-9-]+)*\.vercel\.app$/.test(origin)) return true;
  return false;
}

function createApp() {
  const app = express();
  const allowedOrigins = Array.isArray(env?.allowedOrigins) ? env.allowedOrigins : [];

  if (env?.isProduction || process.env.VERCEL || process.env.RENDER) {
    app.set('trust proxy', 1);
  }

  // Request correlation ID & structured request logging
  app.use((req, res, next) => {
    const correlationId = req.headers['x-request-id'] || crypto.randomUUID();
    req.correlationId = String(correlationId);
    res.setHeader('X-Request-Id', req.correlationId);
    next();
  });

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", ...allowedOrigins]
        }
      },
      crossOriginEmbedderPolicy: false
    })
  );

  // Strict CORS origin validation — never reflect unknown origins
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isOriginAllowed(origin, allowedOrigins)) {
          callback(null, true);
        } else {
          const corsErr = new Error(`Origin '${origin}' is not allowed by CORS policy.`);
          corsErr.status = 403;
          corsErr.code = 'CORS_NOT_ALLOWED';
          callback(corsErr);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-TOKEN', 'X-XSRF-TOKEN', 'X-Request-Id']
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(sanitizeRequest);

  // Global rate limiting, serverless DB readiness & CSRF verification for cookie sessions
  app.use('/api/', apiLimiter);
  app.use('/api/', async (req, _res, next) => {
    if (req.path === '/health' || req.path.startsWith('/docs')) {
      return next();
    }
    try {
      await connectDB();
    } catch (err) {
      console.warn('Database connection warning:', err.message);
    }
    return next();
  });
  app.use('/api/', csrfProtection);

  // API Routes
  app.use('/api/auth',          require('./routes/auth'));
  app.use('/api/profiles',      require('./routes/profiles'));
  app.use('/api/visits',        require('./routes/visits'));
  app.use('/api/prescriptions', require('./routes/prescriptions'));
  app.use('/api/nutrition',     require('./routes/nutrition'));
  app.use('/api/monitoring',    require('./routes/monitoring'));
  app.use('/api/calendar',      require('./routes/calendar'));
  app.use('/api/notifications', require('./routes/notifications'));
  app.use('/api/audit',         require('./routes/audit'));
  app.use('/api/emergency',     require('./routes/emergency'));
  app.use('/api/research',      require('./routes/research'));
  app.use('/api/inventory',     require('./routes/inventory'));
  app.use('/api/ai',            require('./routes/ai'));

  // OpenAPI / Swagger UI Documentation
  app.get('/api/docs.json', (_, res) => res.json(swaggerSpec));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'MedicoAssist API Docs' }));

  app.get('/api/health', (_, res) =>
    res.json({
      success: true,
      message: 'Service healthy.',
      data: {
        status: 'ok',
        platform: 'MedicoAssist Campus Healthcare Platform',
        version: '3.0.0',
        environment: env.nodeEnv,
        timestamp: new Date().toISOString()
      }
    })
  );

  // Standardized 404 for unknown API paths
  app.use('/api/*', (_req, res) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Requested API endpoint does not exist.' }
    });
  });

  // Safe error handler - never exposes stack traces
  app.use((err, req, res, _next) => {
    console.error(`[SERVER ERROR] [${req.correlationId || 'no-id'}]:`, err.message);
    res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: env.isProduction && (!err.status || err.status >= 500)
          ? 'An unexpected internal error occurred.'
          : err.message
      },
      correlationId: req.correlationId
    });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  process.on('uncaughtException', (err) => {
    console.error('[FATAL UNCAUGHT EXCEPTION]:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]:', reason);
  });

  const server = app.listen(env.port, () => {
    console.log(`MedicoAssist API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    connectDB().catch((err) => {
      console.error('Database initialization warning:', err.message);
    });
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}, shutting down HTTP server gracefully...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

app.createApp = createApp;
app.app = app;
module.exports = app;
