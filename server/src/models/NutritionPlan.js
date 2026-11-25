const mongoose = require('mongoose');

const NutritionPlanSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    studentId: { type: String, required: true, uppercase: true, trim: true, index: true },
    studentName: { type: String, trim: true },
    doctorName: { type: String, trim: true },
    goal: { type: String, required: true, trim: true },
    aiSuggested: { type: Boolean, default: false },
    doctorApproved: { type: Boolean, default: false },
    approvedBy: { type: String },
    approvedAt: { type: String },
    reviewDate: { type: String },
    targetCalories: { type: Number, min: 500, max: 6000 },
    proteinG: { type: Number, min: 0, max: 500 },
    carbsG: { type: Number, min: 0, max: 1000 },
    fatG: { type: Number, min: 0, max: 500 },
    meals: {
      breakfast: { type: [String], default: [] },
      midMorning: { type: [String], default: [] },
      lunch: { type: [String], default: [] },
      evening: { type: [String], default: [] },
      dinner: { type: [String], default: [] }
    },
    foodsToLimit: { type: [String], default: [] },
    encouragingNotes: { type: String, default: '' },
    notes: { type: String, default: '' },
    active: { type: Boolean, default: true, index: true },
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

NutritionPlanSchema.index({ studentId: 1, active: 1 });

module.exports = mongoose.model('NutritionPlan', NutritionPlanSchema);
