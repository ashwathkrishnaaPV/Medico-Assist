const mongoose = require('mongoose');

const NutritionPlanSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  studentName: String, doctorName: String, createdAt: String,
  targetCalories: Number, proteinG: Number, carbsG: Number, fatG: Number,
  meals: mongoose.Schema.Types.Mixed,
  foodsToLimit: [String], notes: String, active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('NutritionPlan', NutritionPlanSchema);
