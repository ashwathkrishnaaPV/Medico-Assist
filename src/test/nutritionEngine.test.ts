import { describe, it, expect } from 'vitest';
import { generateAINutritionRecommendation } from '../services/nutritionEngine';
import { StudentProfileData } from '../types';

const baseStudent: StudentProfileData = {
  id: 'prof_1',
  studentId: '24CC006',
  name: 'Ashwath',
  email: 'ashwath@sece.ac.in',
  age: 19,
  dob: '2006-05-12',
  gender: 'Male',
  department: 'CCE',
  year: '2nd Year',
  ugOrPg: 'UG',
  accommodation: 'Hosteller',
  phone: '9876543210',
  bloodGroup: 'O+',
  emergencyContact: { name: 'Parent', relation: 'Mother', phone: '9876543211' },
  medicalCentreContact: '0422-123456',
  criticalAllergies: ['Peanuts', 'Dairy'],
  criticalConditions: [],
  criticalMedications: [],
  heightCm: 175,
  weightKg: 68,
  bmi: 22.2,
  lastUpdated: '2026-11-25',
  profileComplete: true
};

describe('Deterministic Nutrition Engine', () => {
  it('excludes declared allergens (Peanuts, Dairy) from meal suggestions', () => {
    const plan = generateAINutritionRecommendation({
      student: baseStudent,
      conditionName: 'General Wellness'
    });

    const allMealsText = [
      ...plan.meals.breakfast,
      ...plan.meals.midMorning,
      ...plan.meals.lunch,
      ...plan.meals.evening,
      ...plan.meals.dinner
    ]
      .join(' ')
      .toLowerCase();

    expect(allMealsText).not.toContain('peanut');
    expect(allMealsText).not.toContain('paneer');
    expect(allMealsText).not.toContain('greek yogurt');
    expect(plan.doctorApproved).toBe(false);
    expect(plan.encouragingNotes).toContain('Deterministic Clinical Fallback');
    expect(plan.encouragingNotes).toContain('not an autonomous medical prescription');
  });

  it('adjusts target calories higher for underweight students', () => {
    const underweight = { ...baseStudent, weightKg: 48, bmi: 15.7 };
    const plan = generateAINutritionRecommendation({ student: underweight });
    expect(plan.targetCalories).toBeGreaterThanOrEqual(2500);
  });
});
