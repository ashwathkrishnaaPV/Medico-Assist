/**
 * Zod request validation middleware.
 * Validates body, query, and params against strict schemas and rejects unexpected fields.
 */
function validate(schemas = {}) {
  return (req, res, next) => {
    const issues = [];

    if (schemas.params) {
      const parsed = schemas.params.safeParse(req.params || {});
      if (!parsed.success) {
        issues.push(
          ...parsed.error.issues.map((i) => ({
            location: 'params',
            field: i.path.join('.'),
            message: i.message
          }))
        );
      } else {
        req.params = parsed.data;
      }
    }

    if (schemas.query) {
      const parsed = schemas.query.safeParse(req.query || {});
      if (!parsed.success) {
        issues.push(
          ...parsed.error.issues.map((i) => ({
            location: 'query',
            field: i.path.join('.'),
            message: i.message
          }))
        );
      } else {
        req.query = parsed.data;
      }
    }

    if (schemas.body) {
      const parsed = schemas.body.safeParse(req.body ?? {});
      if (!parsed.success) {
        issues.push(
          ...parsed.error.issues.map((i) => ({
            location: 'body',
            field: i.path.join('.') || 'body',
            message: i.message
          }))
        );
      } else {
        req.body = parsed.data;
      }
    }

    if (issues.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: issues[0].message || 'Invalid request payload.',
          details: issues
        }
      });
    }

    next();
  };
}

module.exports = { validate };
