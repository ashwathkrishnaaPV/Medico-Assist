const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MedicoAssist Campus Healthcare API',
    version: '3.0.0',
    description:
      'Production-grade REST API for Campus Healthcare Management featuring HttpOnly JWT cookie authentication, double-submit CSRF protection, RBAC/IDOR enforcement, versioned prescriptions with atomic inventory deduction, append-only server-side audit logs, and OpenAI-compatible AI clinical/educational assistants.'
  },
  servers: [
    { url: '/api', description: 'API Base Path' }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'campushealth_token'
      },
      csrfToken: {
        type: 'apiKey',
        in: 'header',
        name: 'X-CSRF-TOKEN'
      }
    },
    schemas: {
      ApiSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' }
        }
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          }
        }
      }
    }
  },
  security: [{ cookieAuth: [], csrfToken: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Service health check',
        security: [],
        responses: { 200: { description: 'Service is healthy' } }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user with email & bcrypt password (sets HttpOnly JWT + XSRF-TOKEN cookie)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 1 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated; session cookies issued' },
          400: { description: 'Missing email or password' },
          401: { description: 'Invalid credentials' },
          423: { description: 'Account temporarily locked due to brute-force attempts' }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Student self-registration (strictly restricted to STUDENT role)',
        security: [],
        responses: {
          201: { description: 'Student account registered' },
          400: { description: 'Validation error or disallowed role field' },
          409: { description: 'Email already exists' }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get authenticated session user profile',
        responses: { 200: { description: 'Current user returned' }, 401: { description: 'Unauthorized' } }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Revoke current JWT JTI and clear session cookies',
        responses: { 200: { description: 'Logged out' } }
      }
    },
    '/auth/users': {
      get: {
        tags: ['Admin Governance'],
        summary: 'List users with pagination and search (ADMIN only)',
        responses: { 200: { description: 'Paginated users' }, 403: { description: 'Forbidden' } }
      },
      post: {
        tags: ['Admin Governance'],
        summary: 'Create staff/admin/student account (ADMIN only)',
        responses: { 201: { description: 'User created' }, 403: { description: 'Forbidden' } }
      }
    },
    '/profiles': {
      get: {
        tags: ['Student Profiles'],
        summary: 'List student profiles (STUDENT sees own only; MEDICAL_STAFF sees authorized records)',
        responses: { 200: { description: 'Profiles list' } }
      },
      post: {
        tags: ['Student Profiles'],
        summary: 'Create or update student profile with ownership/role check',
        responses: { 200: { description: 'Profile saved' } }
      }
    },
    '/profiles/{studentId}': {
      get: {
        tags: ['Student Profiles'],
        summary: 'Get student profile by studentId (IDOR protected)',
        parameters: [{ name: 'studentId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Profile returned' }, 403: { description: 'IDOR blocked' } }
      }
    },
    '/visits': {
      get: {
        tags: ['Clinical Visits'],
        summary: 'List medical visits with pagination and ownership filtering',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
        ],
        responses: { 200: { description: 'Paginated medical visits' } }
      },
      post: {
        tags: ['Clinical Visits'],
        summary: 'Create clinical visit & vitals (MEDICAL_STAFF only)',
        responses: { 201: { description: 'Visit created' }, 403: { description: 'Forbidden' } }
      }
    },
    '/prescriptions': {
      get: {
        tags: ['Prescriptions'],
        summary: 'List prescriptions with version history (IDOR protected)',
        responses: { 200: { description: 'Prescriptions returned' } }
      },
      post: {
        tags: ['Prescriptions'],
        summary: 'Issue prescription v1 & atomically deduct pharmacy inventory (MEDICAL_STAFF only)',
        responses: { 201: { description: 'Prescription issued and stock deducted' } }
      }
    },
    '/prescriptions/{id}': {
      put: {
        tags: ['Prescriptions'],
        summary: 'Create new immutable prescription version (v2+) & adjust inventory (MEDICAL_STAFF only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'New version appended' } }
      }
    },
    '/inventory': {
      get: {
        tags: ['Pharmacy Inventory'],
        summary: 'List medicine inventory & stock thresholds (ADMIN & MEDICAL_STAFF)',
        responses: { 200: { description: 'Inventory list' }, 403: { description: 'Forbidden for students' } }
      }
    },
    '/monitoring/plans': {
      get: { tags: ['Monitoring'], summary: 'List active monitoring plans', responses: { 200: { description: 'Plans' } } },
      post: { tags: ['Monitoring'], summary: 'Activate daily monitoring plan (MEDICAL_STAFF only)', responses: { 201: { description: 'Plan activated' } } }
    },
    '/monitoring/responses': {
      get: { tags: ['Monitoring'], summary: 'List daily check-in responses', responses: { 200: { description: 'Responses' } } },
      post: { tags: ['Monitoring'], summary: 'Submit daily student monitoring response', responses: { 201: { description: 'Response recorded' } } }
    },
    '/nutrition': {
      get: { tags: ['Nutrition'], summary: 'List nutrition plans', responses: { 200: { description: 'Plans' } } },
      post: { tags: ['Nutrition'], summary: 'Save clinician-approved nutrition plan (MEDICAL_STAFF only)', responses: { 201: { description: 'Plan saved' } } }
    },
    '/audit': {
      get: {
        tags: ['Audit & Compliance'],
        summary: 'Query immutable server-side audit logs (ADMIN only)',
        responses: { 200: { description: 'Audit logs' }, 403: { description: 'Forbidden' } }
      }
    },
    '/audit/backup': {
      post: {
        tags: ['Audit & Compliance'],
        summary: 'Create server-side JSON database snapshot backup (ADMIN only)',
        responses: { 201: { description: 'Backup snapshot created' } }
      }
    },
    '/emergency/token': {
      post: {
        tags: ['Emergency Access'],
        summary: 'Generate ephemeral SHA-256 hashed emergency QR token (15-min TTL)',
        responses: { 201: { description: 'Token issued' } }
      }
    },
    '/emergency/access': {
      post: {
        tags: ['Emergency Access'],
        summary: 'Redeem emergency token for minimum-necessary 7-field triage dataset',
        security: [],
        responses: { 200: { description: 'Minimum-necessary emergency card' }, 401: { description: 'Expired/invalid token' } }
      }
    },
    '/ai/health-info': {
      post: {
        tags: ['AI Assistant'],
        summary: 'Non-diagnostic healthcare education & terminology Q&A (PHI-stripped)',
        responses: { 200: { description: 'Educational answer with disclaimer' } }
      }
    },
    '/ai/nutrition-advice': {
      post: {
        tags: ['AI Assistant'],
        summary: 'Allergy-aware & preference-aware educational meal guidance',
        responses: { 200: { description: 'Nutrition guidance with disclaimer' } }
      }
    },
    '/ai/trend-explanation': {
      post: {
        tags: ['AI Assistant'],
        summary: 'Plain-language explanation of longitudinal vital measurement trends',
        responses: { 200: { description: 'Trend summary with disclaimer' } }
      }
    },
    '/ai/visit-summary-draft': {
      post: {
        tags: ['AI Assistant'],
        summary: 'Clinician-reviewed consultation summary draft (MEDICAL_STAFF only)',
        responses: { 200: { description: 'Structured draft generated' }, 403: { description: 'Forbidden' } }
      }
    }
  }
};

module.exports = swaggerSpec;
