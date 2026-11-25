const env = require('../config/env');

const DISCLAIMER =
  'This assistant provides educational and informational support only and is not a substitute for professional medical care, diagnosis, or clinical advice.';

const SYSTEM_SAFETY_PROMPT = `You are the MedicoAssist Campus Healthcare Educational Assistant.
Your mission is to provide clear, evidence-based healthcare education, explain clinical terms, and assist with wellness lifestyle guidance.
STRICT CLINICAL SAFETY RULES:
1. NEVER diagnose a disease or state that the user has a specific condition.
2. NEVER prescribe or recommend specific prescription dosages or medications.
3. ALWAYS include a recommendation to consult the campus health medical team or a licensed healthcare professional.
4. Keep guidance supportive, collegiate, evidence-informed, and clear.`;

/**
 * Strips identifiable student details from free-form text before sending to LLM.
 */
function stripPhi(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[STUDENT_EMAIL]')
    .replace(/\b(24[A-Z]{2}\d{3}|STU\d{4}|ADM\d{3}|DOC\d{3})\b/gi, '[ID_TOKEN]')
    .replace(/\b\d{10}\b/g, '[PHONE_NUMBER]')
    .slice(0, 1500);
}

/**
 * Calls OpenAI-compatible REST API if configured, otherwise returns null to trigger deterministic fallback.
 */
async function callOpenAICompatible(messages, maxTokens = 600) {
  const { apiKey, baseUrl, model, timeoutMs } = env.aiConfig;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || 15000);

  try {
    const url = `${baseUrl}/chat/completions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[AI SERVICE WARNING]: External LLM call failed with HTTP ${res.status}: ${errText.slice(0, 150)}`);
      return null;
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    return content ? String(content).trim() : null;
  } catch (err) {
    console.warn(`[AI SERVICE WARNING]: LLM request timed out or network error: ${err.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ==========================================
// DETERMINISTIC CLINICAL FALLBACK ENGINES
// ==========================================

function fallbackHealthAnswer(question, context = '') {
  const q = question.toLowerCase();

  if (q.includes('blood pressure') || q.includes('bp')) {
    return `### Blood Pressure Overview\n\nBlood pressure measures the hydrostatic force of blood circulating against the walls of blood vessels.\n\n- **Systolic (top number)**: Pressure when the heart beats (normal: 90–120 mmHg).\n- **Diastolic (bottom number)**: Pressure when the heart rests between beats (normal: 60–80 mmHg).\n\nVariations can occur due to stress, hydration, exercise, and sleep. Consistently high (>130/80) or low (<90/60) readings should be reviewed with your campus physician.`;
  }

  if (q.includes('bmi') || q.includes('body mass index')) {
    return `### Body Mass Index (BMI) Explanation\n\nBMI is a general screening indicator calculated from weight and height (kg/m²).\n\n- **Underweight**: < 18.5\n- **Normal Range**: 18.5 – 24.9\n- **Overweight**: 25.0 – 29.9\n- **Obesity Tier**: ≥ 30.0\n\n*Note*: BMI does not differentiate between skeletal muscle and adipose tissue. For athlete students or body composition questions, schedule a personalized clinical evaluation.`;
  }

  if (q.includes('spo2') || q.includes('oxygen')) {
    return `### Blood Oxygen Saturation (SpO2)\n\nSpO2 represents the percentage of oxygen-saturated hemoglobin relative to total hemoglobin.\n\n- **Normal campus range**: 95% – 100%\n- **Observation threshold**: 93% – 94% (monitor for acute fatigue, respiratory illness)\n- **Clinical alert**: Below 92% requires immediate medical triage.`;
  }

  if (q.includes('fever') || q.includes('temperature') || q.includes('temp')) {
    return `### Body Temperature & Fever Care\n\nNormal core body temperature typically ranges from 97.8°F to 99.0°F (36.5°C – 37.2°C).\n\n- **Mild Elevation**: 99.1°F – 100.4°F\n- **Clinical Fever**: ≥ 100.4°F (38.0°C)\n\nMaintain adequate hydration with electrolytes and visit the campus medical centre if accompanied by persistent headache, stiff neck, or vomiting.`;
  }

  return `### General Healthcare Information\n\nRegarding: "${question}"\n\n${context ? `*Context*: ${context}\n\n` : ''}Maintaining adequate hydration (2–3 liters daily), consistent sleep (7–8 hours), balanced nutrition, and regular physical activity are foundational to campus academic wellness. For persistent symptoms or medical questions, please consult with the campus medical practitioner.`;
}

function fallbackNutritionAdvice({ goal, allergies = [], preferences = '', currentBmi = 22 }) {
  const safeAllergies = (allergies || []).map((a) => a.toLowerCase());

  let mealSuggestions = {
    breakfast: ['Rolled oats with chia seeds, blueberries, and cinnamon', 'Boiled eggs with whole-grain toast'],
    lunch: ['Lentil dal or grilled tofu/chicken with brown rice and steamed green beans', 'Mixed vegetable salad with olive oil'],
    dinner: ['Steamed quinoa with roasted zucchini, bell peppers, and kidney beans', 'Clear vegetable broth soup'],
    snacks: ['Seasonal citrus fruits', 'Handful of roasted pumpkin seeds', 'Herbal green tea']
  };

  // Allergy safety adjustments
  if (safeAllergies.some((a) => a.includes('peanut') || a.includes('nut'))) {
    mealSuggestions.snacks = mealSuggestions.snacks.filter((s) => !s.toLowerCase().includes('seed') && !s.toLowerCase().includes('nut'));
    mealSuggestions.snacks.push('Apple slices with sunflower butter', 'Rice cakes with cucumber');
  }

  if (safeAllergies.some((a) => a.includes('dairy') || a.includes('lactose'))) {
    mealSuggestions.breakfast = mealSuggestions.breakfast.map((b) => b.replace(/milk|yogurt/gi, 'almond or soy beverage'));
  }

  if (safeAllergies.some((a) => a.includes('gluten') || a.includes('wheat'))) {
    mealSuggestions.breakfast = mealSuggestions.breakfast.map((b) => b.replace(/whole-grain toast/gi, 'gluten-free millet bread'));
  }

  return `### Personalized Educational Nutrition Guidance\n\n**Wellness Goal**: ${goal}\n**Screening BMI**: ${currentBmi} ${preferences ? `\n**Preferences**: ${preferences}` : ''}\n**Allergy Flags Observed**: ${allergies.length > 0 ? allergies.join(', ') : 'None declared'}\n\n#### Recommended Educational Meal Structure:\n- **Breakfast**: ${mealSuggestions.breakfast.join(' OR ')}\n- **Lunch**: ${mealSuggestions.lunch.join(' + ')}\n- **Evening Snack**: ${mealSuggestions.snacks.join(' OR ')}\n- **Dinner**: ${mealSuggestions.dinner.join(' + ')}\n\n*Hydration Reminder*: Aim for 8–10 glasses of clean water daily, spaced evenly throughout study hours.`;
}

function fallbackTrendExplanation(vitalsHistory = []) {
  if (!vitalsHistory || vitalsHistory.length === 0) {
    return 'Insufficient vital history records to analyze longitudinal trends. Keep logging consultations and check-ins.';
  }

  const latest = vitalsHistory[0] || {};
  const prev = vitalsHistory[1];

  let summary = `### Health Measurement Summary\n\n- **Most Recent Reading**: BP ${latest.bloodPressureSys || 120}/${latest.bloodPressureDia || 80} mmHg, HR ${latest.heartRateBpm || 72} bpm, Temp ${latest.temperatureF || 98.6}°F, SpO2 ${latest.spo2Percent || 99}%.\n`;

  if (prev) {
    const sysDiff = (Number(latest.bloodPressureSys) || 120) - (Number(prev.bloodPressureSys) || 120);
    const hrDiff = (Number(latest.heartRateBpm) || 72) - (Number(prev.heartRateBpm) || 72);

    summary += `\n#### Comparison with Previous Consultation:\n`;
    summary += `- **Blood Pressure**: ${sysDiff === 0 ? 'Remained stable' : sysDiff > 0 ? `Increased by ${sysDiff} mmHg` : `Decreased by ${Math.abs(sysDiff)} mmHg`}.\n`;
    summary += `- **Heart Rate**: ${hrDiff === 0 ? 'Unchanged' : hrDiff > 0 ? `Elevated by ${hrDiff} bpm` : `Lowered by ${Math.abs(hrDiff)} bpm`}.\n`;
    summary += `\n*Possible Lifestyle Factors*: Temporary variations can stem from exam stress, caffeine consumption within 2 hours, insufficient sleep, or recent walking/stairs.`;
  }

  summary += `\n\n*Note*: If you feel dizzy, short of breath, or notice elevated palpitations, report to the Medical Centre triage desk immediately.`;
  return summary;
}

function fallbackVisitSummaryDraft({ chiefComplaint, diagnosis, vitals = {}, clinicalNotes = '' }) {
  return `### Clinical Consultation Summary (Draft for Clinician Review)\n\n**Patient Chief Complaint**: ${chiefComplaint}\n**Primary Assessment / Working Diagnosis**: ${diagnosis}\n**Recorded Baseline Vitals**: BP ${vitals.bloodPressureSys || '—'}/${vitals.bloodPressureDia || '—'} mmHg | HR ${vitals.heartRateBpm || '—'} bpm | Temp ${vitals.temperatureF || '—'}°F | SpO2 ${vitals.spo2Percent || '—'}%\n\n**Clinical Findings & Progress**:\n${clinicalNotes || 'Patient evaluated during scheduled consultation. Vital parameters documented. Clinical trajectory stable.'}\n\n**Patient Care & Lifestyle Instructions**:\n1. Adhere strictly to the prescribed therapeutic schedule.\n2. Maintain consistent oral hydration.\n3. Return for scheduled reconsultation or earlier if symptoms escalate.\n\n*Clinician Review Stamp: [Pending Doctor Approval]*`;
}

// ==========================================
// PUBLIC SERVICE API
// ==========================================

async function askHealthAssistant(question, context = '') {
  const cleanQ = stripPhi(question);
  const cleanCtx = stripPhi(context);

  const messages = [
    { role: 'system', content: SYSTEM_SAFETY_PROMPT },
    {
      role: 'user',
      content: `Answer the following healthcare education query clearly:\nQuestion: ${cleanQ}\n${cleanCtx ? `Context: ${cleanCtx}` : ''}`
    }
  ];

  const llmText = await callOpenAICompatible(messages, 450);
  if (llmText) {
    return {
      text: `${llmText}\n\n---\n*Disclaimer*: ${DISCLAIMER}`,
      source: 'LLM',
      model: env.aiConfig.model,
      disclaimer: DISCLAIMER
    };
  }

  return {
    text: `${fallbackHealthAnswer(cleanQ, cleanCtx)}\n\n---\n*Disclaimer*: ${DISCLAIMER}`,
    source: 'DETERMINISTIC_FALLBACK',
    model: 'CarePlus-Rule-Engine-v3.0',
    disclaimer: DISCLAIMER
  };
}

async function generateNutritionAssistantAdvice({ goal, allergies = [], preferences = '', currentBmi = 22 }) {
  const cleanGoal = stripPhi(goal);
  const cleanPref = stripPhi(preferences);

  const messages = [
    { role: 'system', content: `${SYSTEM_SAFETY_PROMPT}\nYou are specialized in educational collegiate nutrition and meal planning. Never prescribe a strict medical diet for critical illnesses.` },
    {
      role: 'user',
      content: `Create an educational daily meal recommendation for a student:\nGoal: ${cleanGoal}\nAllergies to strictly avoid: ${allergies.join(', ') || 'None'}\nDietary Preferences: ${cleanPref || 'General collegiate'}\nCurrent Screening BMI: ${currentBmi}`
    }
  ];

  const llmText = await callOpenAICompatible(messages, 550);
  if (llmText) {
    return {
      text: `${llmText}\n\n---\n*Disclaimer*: ${DISCLAIMER}`,
      source: 'LLM',
      model: env.aiConfig.model,
      disclaimer: DISCLAIMER
    };
  }

  return {
    text: `${fallbackNutritionAdvice({ goal: cleanGoal, allergies, preferences: cleanPref, currentBmi })}\n\n---\n*Disclaimer*: ${DISCLAIMER}`,
    source: 'DETERMINISTIC_FALLBACK',
    model: 'CarePlus-Nutrition-Engine-v3.0',
    disclaimer: DISCLAIMER
  };
}

async function explainVitalsTrends(vitalsHistory = []) {
  const cleanHistory = vitalsHistory.slice(0, 10).map((v) => ({
    date: v.recordedAt || v.visitDate || 'Recent',
    sys: v.bloodPressureSys,
    dia: v.bloodPressureDia,
    hr: v.heartRateBpm,
    temp: v.temperatureF,
    spo2: v.spo2Percent
  }));

  const messages = [
    { role: 'system', content: SYSTEM_SAFETY_PROMPT },
    {
      role: 'user',
      content: `Summarize the non-critical lifestyle context of these vital trend measurements in clear collegiate terms:\n${JSON.stringify(cleanHistory, null, 2)}`
    }
  ];

  const llmText = await callOpenAICompatible(messages, 450);
  if (llmText) {
    return {
      text: `${llmText}\n\n---\n*Disclaimer*: ${DISCLAIMER}`,
      source: 'LLM',
      model: env.aiConfig.model,
      disclaimer: DISCLAIMER
    };
  }

  return {
    text: `${fallbackTrendExplanation(vitalsHistory)}\n\n---\n*Disclaimer*: ${DISCLAIMER}`,
    source: 'DETERMINISTIC_FALLBACK',
    model: 'CarePlus-Trend-Engine-v3.0',
    disclaimer: DISCLAIMER
  };
}

async function draftVisitSummary({ chiefComplaint, diagnosis, vitals = {}, clinicalNotes = '' }) {
  const cleanComplaint = stripPhi(chiefComplaint);
  const cleanDiag = stripPhi(diagnosis);
  const cleanNotes = stripPhi(clinicalNotes);

  const messages = [
    {
      role: 'system',
      content: `${SYSTEM_SAFETY_PROMPT}\nYou assist clinicians with drafting concise, structured clinical consultation summaries. You must include a notice that this draft is clinician-reviewed and clinician-approved.`
    },
    {
      role: 'user',
      content: `Draft a structured clinical consultation summary for the physician to review:\nChief Complaint: ${cleanComplaint}\nDiagnosis: ${cleanDiag}\nVitals: ${JSON.stringify(vitals)}\nDoctor's Notes: ${cleanNotes}`
    }
  ];

  const llmText = await callOpenAICompatible(messages, 500);
  if (llmText) {
    return {
      text: `${llmText}\n\n---\n*Disclaimer*: ${DISCLAIMER}`,
      source: 'LLM',
      model: env.aiConfig.model,
      disclaimer: DISCLAIMER
    };
  }

  return {
    text: `${fallbackVisitSummaryDraft({ chiefComplaint: cleanComplaint, diagnosis: cleanDiag, vitals, clinicalNotes: cleanNotes })}\n\n---\n*Disclaimer*: ${DISCLAIMER}`,
    source: 'DETERMINISTIC_FALLBACK',
    model: 'CarePlus-Clinical-Draft-Engine-v3.0',
    disclaimer: DISCLAIMER
  };
}

module.exports = {
  askHealthAssistant,
  generateNutritionAssistantAdvice,
  explainVitalsTrends,
  draftVisitSummary,
  stripPhi,
  DISCLAIMER
};
