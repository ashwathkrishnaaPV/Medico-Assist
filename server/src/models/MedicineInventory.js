const mongoose = require('mongoose');

const MedicineInventorySchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, index: true },
    catalogId: { type: Number, index: true },
    name: { type: String, required: true, trim: true, index: true },
    generic: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: 'Tablet' },
    isTablet: { type: Boolean, default: true },
    defaultDosage: { type: String, default: '1 tablet' },
    symptoms: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0, default: 100 },
    minThreshold: { type: Number, required: true, min: 1, default: 20 },
    status: {
      type: String,
      enum: ['Full Stock', 'Less Stock', 'Restock'],
      default: 'Full Stock',
      index: true
    },
    lastRestocked: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret.id || String(ret._id);
        delete ret.__v;
        return ret;
      }
    }
  }
);

MedicineInventorySchema.index({ name: 'text', generic: 'text', symptoms: 'text' });

module.exports = mongoose.model('MedicineInventory', MedicineInventorySchema);
