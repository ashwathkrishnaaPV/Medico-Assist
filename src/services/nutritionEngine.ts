import { StudentProfileData, NutritionPlan } from '../types';

export interface NutritionEngineInput {
  student: StudentProfileData;
  conditionName?: string;
  doctorNotes?: string;
}

export function generateAINutritionRecommendation(input: NutritionEngineInput): NutritionPlan {
  const { student, conditionName, doctorNotes } = input;
  const bmi = student.bmi;
  const allergies = student.criticalAllergies || [];

  let goal = 'Balanced collegiate wellness, immunity support & sustainable energy';
  let breakfast = ['Whole grain oatmeal with fruit & flaxseeds', '1 glass of warm lemon water or milk'];
  let midMorning = ['Fresh apple or seasonal fruit', 'Handful of walnuts'];
  let lunch = ['Grilled protein (chicken/tofu/beans)', 'Steamed brown rice', 'Mixed salad with olive oil'];
  let evening = ['Green tea or chamomile tea', 'Whole grain toast with avocado'];
  let dinner = ['Lentil or vegetable soup', 'Roasted seasonal vegetables', 'Baked protein'];
  let foodsToLimit = ['Excessive caffeine energy drinks', 'Ultra-processed fried foods', 'High refined sugar snacks'];

  if (conditionName && conditionName.toLowerCase().includes('bronchitis')) {
    goal = 'Respiratory inflammation reduction & immune acceleration';
    breakfast = ['Warm steel-cut oats with honey & blueberries', 'Warm herbal tea'];
    midMorning = ['Fresh citrus oranges (Vitamin C)', 'Almonds'];
    lunch = ['Warm chicken/lentil vegetable broth', 'Spinach quinoa bowl'];
    evening = ['Warm turmeric ginger infusion', 'Pumpkin seeds'];
    dinner = ['Steamed fish or steamed tofu with sweet potatoes and broccoli'];
    foodsToLimit = ['Chilled ice drinks', 'Deep fried items', 'Heavy dairy if phlegm-heavy'];
  } else if (bmi < 18.5) {
    goal = 'Nutrient-dense weight build & muscle strength support';
    breakfast = ['Whole milk smoothie with banana, peanut butter & protein', 'Scrambled eggs on sourdough'];
    midMorning = ['Greek yogurt with honey and granola'];
    lunch = ['Quinoa & avocado protein bowl', 'Whole wheat pita with hummus'];
    dinner = ['Lean steak / paneer roast with baked potato and greens'];
  } else if (bmi > 25) {
    goal = 'Metabolic vitality, high-fiber energy balance & hydration';
    breakfast = ['Spinach & mushroom egg white omelet', 'Black coffee or green tea'];
    midMorning = ['Cucumber slices with hummus'];
    lunch = ['Massaged kale & chickpea salad with lemon dressing'];
    dinner = ['Grilled zucchini and white fish / beans supreme'];
  }

  // Filter out allergic foods
  if (allergies.some(a => a.toLowerCase().includes('peanut'))) {
    breakfast = breakfast.map(b => b.replace(/peanut/gi, 'almond'));
    midMorning = midMorning.map(m => m.replace(/peanut/gi, 'sunflower seed'));
    lunch = lunch.map(l => l.replace(/peanut/gi, 'sesame'));
    dinner = dinner.map(d => d.replace(/peanut/gi, 'cashew'));
    foodsToLimit.push('ALL Peanuts & peanut oil (Strict allergy flag)');
  }

  return {
    id: `nut_${Date.now()}`,
    studentId: student.studentId,
    goal: `${goal}${doctorNotes ? ` — Clinician Note: ${doctorNotes}` : ''}`,
    aiSuggested: true,
    doctorApproved: false,
    reviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    meals: {
      breakfast,
      midMorning,
      lunch,
      evening,
      dinner
    },
    foodsToLimit,
    encouragingNotes: 'Nutritional recommendation generated based on clinical vitals, health history, and screening trends. Doctor approval required before publishing.'
  };
}
