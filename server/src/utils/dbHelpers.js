const isObjectId = (value) => typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value.trim());

/**
 * Safely converts a Mongoose Document (or array of Documents) to plain JSON objects.
 */
function toPlain(doc) {
  if (!doc) return null;
  if (Array.isArray(doc)) return doc.map(toPlain);
  if (typeof doc.toJSON === 'function') return doc.toJSON();
  return { ...doc };
}

/**
 * Builds a CastError-safe query filter matching Mongo _id (only when valid 24-hex ObjectId)
 * and/or custom string `id` field when defined in the Mongoose schema.
 */
function buildIdentifierFilter(Model, rawId) {
  if (!rawId) return null;
  const strId = String(rawId).trim();
  if (!strId) return null;

  if (!Model || !Model.schema) {
    return null;
  }

  const clauses = [];
  if (isObjectId(strId)) {
    clauses.push({ _id: strId });
  }
  if (Model.schema.path('id')) {
    clauses.push({ id: strId });
  }

  if (clauses.length === 0) return null;
  return clauses.length === 1 ? clauses[0] : { $or: clauses };
}

/**
 * Looks up a record safely across Mongoose models (by ObjectId _id or custom string id)
 * and localDb/pgDb collections without throwing Mongoose CastError.
 */
async function findByIdentifier(Model, rawId) {
  if (!Model || !rawId) return null;
  const strId = String(rawId).trim();
  if (!strId) return null;

  if (!Model.schema) {
    return typeof Model.findById === 'function' ? Model.findById(strId) : null;
  }

  const filter = buildIdentifierFilter(Model, strId);
  if (!filter) return null;
  return Model.findOne(filter);
}

/**
 * Updates a record safely across Mongoose models and localDb/pgDb without CastError,
 * always defaulting to `{ new: true }`.
 */
async function updateByIdentifier(Model, rawId, update, options = {}) {
  if (!Model || !rawId) return null;
  const strId = String(rawId).trim();
  if (!strId) return null;

  const opts = { new: true, ...options };

  if (!Model.schema) {
    return typeof Model.findByIdAndUpdate === 'function'
      ? Model.findByIdAndUpdate(strId, update, opts)
      : null;
  }

  const filter = buildIdentifierFilter(Model, strId);
  if (!filter) return null;
  return Model.findOneAndUpdate(filter, update, opts);
}

module.exports = {
  isObjectId,
  toPlain,
  buildIdentifierFilter,
  findByIdentifier,
  updateByIdentifier
};
