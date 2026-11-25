import { Vitals, RiskTier, RiskEvaluationResult, DualRiskEvaluation, ContributingFactor } from '../types';

export interface ClinicalRiskInput {
  studentId?: string;
  vitals?: Partial<Vitals>;
  symptomSeverity?: number;
  chronicConditions?: string[];
  medicationAdherent?: boolean;
  age?: number;
  bmi?: number;
  symptoms?: string[];
}

export const BASELINE_VITALS = {
  bloodPressureSys: 118,
  bloodPressureDia: 78,
  heartRateBpm: 72,
  spo2Percent: 98,
  temperatureF: 98.6,
  bmi: 22.0,
  age: 20
};

const FEATURE_WEIGHTS = {
  sbpHigh: 0.045,
  sbpLow: 0.060,
  dbpHigh: 0.030,
  spo2Deficit: 0.180,
  hrHigh: 0.035,
  hrLow: 0.040,
  tempHigh: 0.450,
  tempLow: 0.550,
  bmiExcess: 0.040,
  bmiDeficit: 0.050,
  symptomSeverity: 0.380,
  comorbidityWeight: 0.650,
  nonAdherencePenalty: 0.850
};

/**
 * Evaluates Baseline Rule-Based Triage (NEWS2 adapted for collegiate clinic)
 */
export function evaluateRuleBasedNEWS2(vitals: Partial<Vitals> = {}, symptomSeverity: number = 0): {
  engine: string;
  totalScore: number;
  riskTier: RiskTier;
  contributingRules: string[];
} {
  let score = 0;
  const contributingRules: string[] = [];

  const sbp = vitals.bloodPressureSys || 120;
  const hr = vitals.heartRateBpm || 75;
  const spo2 = vitals.spo2Percent || 98;
  const temp = vitals.temperatureF || 98.6;

  // Respiration / SpO2
  if (spo2 <= 91) {
    score += 3;
    contributingRules.push('Severe Hypoxemia (SpO2 <= 91%): +3 pts');
  } else if (spo2 <= 93) {
    score += 2;
    contributingRules.push('Moderate Hypoxemia (SpO2 92-93%): +2 pts');
  } else if (spo2 <= 95) {
    score += 1;
    contributingRules.push('Mild Hypoxemia (SpO2 94-95%): +1 pt');
  }

  // Systolic Blood Pressure
  if (sbp <= 90) {
    score += 3;
    contributingRules.push('Severe Hypotension (SBP <= 90 mmHg): +3 pts');
  } else if (sbp <= 100) {
    score += 2;
    contributingRules.push('Moderate Hypotension (SBP 91-100 mmHg): +2 pts');
  } else if (sbp <= 110) {
    score += 1;
    contributingRules.push('Mild Hypotension (SBP 101-110 mmHg): +1 pt');
  } else if (sbp >= 200) {
    score += 3;
    contributingRules.push('Hypertensive Crisis (SBP >= 200 mmHg): +3 pts');
  } else if (sbp >= 160) {
    score += 2;
    contributingRules.push('Stage 2 Hypertension (SBP >= 160 mmHg): +2 pts');
  }

  // Heart Rate
  if (hr <= 40) {
    score += 3;
    contributingRules.push('Severe Bradycardia (HR <= 40 bpm): +3 pts');
  } else if (hr <= 50) {
    score += 1;
    contributingRules.push('Mild Bradycardia (HR 41-50 bpm): +1 pt');
  } else if (hr >= 131) {
    score += 3;
    contributingRules.push('Severe Tachycardia (HR >= 131 bpm): +3 pts');
  } else if (hr >= 111) {
    score += 2;
    contributingRules.push('Moderate Tachycardia (HR 111-130 bpm): +2 pts');
  } else if (hr >= 91) {
    score += 1;
    contributingRules.push('Mild Tachycardia (HR 91-110 bpm): +1 pt');
  }

  // Temperature
  if (temp <= 95.0) {
    score += 3;
    contributingRules.push('Severe Hypothermia (Temp <= 95.0°F): +3 pts');
  } else if (temp <= 96.8) {
    score += 1;
    contributingRules.push('Mild Hypothermia (Temp 95.1-96.8°F): +1 pt');
  } else if (temp >= 102.4) {
    score += 2;
    contributingRules.push('High Fever (Temp >= 102.4°F): +2 pts');
  } else if (temp >= 100.5) {
    score += 1;
    contributingRules.push('Pyrexia (Temp 100.5-102.3°F): +1 pt');
  }

  // Symptom severity
  if (symptomSeverity >= 8) {
    score += 2;
    contributingRules.push('Acute High Symptom Severity (>=8/10): +2 pts');
  } else if (symptomSeverity >= 5) {
    score += 1;
    contributingRules.push('Moderate Symptom Severity (>=5/10): +1 pt');
  }

  let riskTier: RiskTier = 'LOW';
  if (score >= 7) riskTier = 'URGENT';
  else if (score >= 5) riskTier = 'HIGH';
  else if (score >= 3) riskTier = 'MODERATE';

  return {
    engine: 'NEWS2_RULE_BASED_BASELINE',
    totalScore: score,
    riskTier,
    contributingRules
  };
}

/**
 * Evaluates Machine Learning Clinical Risk Model with Additive Feature Attribution (XAI)
 */
export function evaluateMLRiskStratification(input: ClinicalRiskInput): RiskEvaluationResult {
  const {
    vitals = {},
    symptomSeverity = 0,
    chronicConditions = [],
    medicationAdherent = true
  } = input;

  const sbp = vitals.bloodPressureSys || BASELINE_VITALS.bloodPressureSys;
  const hr = vitals.heartRateBpm || BASELINE_VITALS.heartRateBpm;
  const spo2 = vitals.spo2Percent || BASELINE_VITALS.spo2Percent;
  const temp = vitals.temperatureF || BASELINE_VITALS.temperatureF;

  const contributions: ContributingFactor[] = [];
  let logOdds = -2.4; // Collegiate baseline prior

  // Systolic BP
  if (sbp > 120) {
    const diff = sbp - 120;
    const impact = diff * FEATURE_WEIGHTS.sbpHigh;
    logOdds += impact;
    contributions.push({
      feature: 'Systolic Blood Pressure',
      clinicalValue: `${sbp} mmHg`,
      attributionScore: parseFloat(impact.toFixed(3)),
      direction: 'RISK_INCREASING',
      percentageOfRisk: 0,
      explanation: `Elevated systolic pressure above 120 mmHg contributes +${(impact * 10).toFixed(1)}% to clinical risk score.`
    });
  } else if (sbp < 100) {
    const diff = 100 - sbp;
    const impact = diff * FEATURE_WEIGHTS.sbpLow;
    logOdds += impact;
    contributions.push({
      feature: 'Systolic Blood Pressure',
      clinicalValue: `${sbp} mmHg`,
      attributionScore: parseFloat(impact.toFixed(3)),
      direction: 'RISK_INCREASING',
      percentageOfRisk: 0,
      explanation: `Hypotensive systolic pressure below 100 mmHg contributes +${(impact * 10).toFixed(1)}% to risk score.`
    });
  }

  // SpO2
  if (spo2 < 96) {
    const diff = 96 - spo2;
    const impact = diff * FEATURE_WEIGHTS.spo2Deficit;
    logOdds += impact;
    contributions.push({
      feature: 'Peripheral Oxygen Saturation (SpO2)',
      clinicalValue: `${spo2}%`,
      attributionScore: parseFloat(impact.toFixed(3)),
      direction: 'RISK_INCREASING',
      percentageOfRisk: 0,
      explanation: `Desaturation below normoxemia (96%) represents acute respiratory strain (+${(impact * 10).toFixed(1)}%).`
    });
  }

  // Heart Rate
  if (hr > 90) {
    const diff = hr - 90;
    const impact = diff * FEATURE_WEIGHTS.hrHigh;
    logOdds += impact;
    contributions.push({
      feature: 'Heart Rate',
      clinicalValue: `${hr} bpm`,
      attributionScore: parseFloat(impact.toFixed(3)),
      direction: 'RISK_INCREASING',
      percentageOfRisk: 0,
      explanation: `Tachycardia elevation above resting baseline contributes +${(impact * 10).toFixed(1)}% to clinical score.`
    });
  } else if (hr < 55) {
    const diff = 55 - hr;
    const impact = diff * FEATURE_WEIGHTS.hrLow;
    logOdds += impact;
    contributions.push({
      feature: 'Heart Rate',
      clinicalValue: `${hr} bpm`,
      attributionScore: parseFloat(impact.toFixed(3)),
      direction: 'RISK_INCREASING',
      percentageOfRisk: 0,
      explanation: `Bradycardia below 55 bpm contributes +${(impact * 10).toFixed(1)}% to risk score.`
    });
  }

  // Temperature
  if (temp > 99.5) {
    const diff = temp - 99.5;
    const impact = diff * FEATURE_WEIGHTS.tempHigh;
    logOdds += impact;
    contributions.push({
      feature: 'Body Temperature',
      clinicalValue: `${temp}°F`,
      attributionScore: parseFloat(impact.toFixed(3)),
      direction: 'RISK_INCREASING',
      percentageOfRisk: 0,
      explanation: `Pyrexia / elevated temperature indicates active inflammatory or infectious response (+${(impact * 10).toFixed(1)}%).`
    });
  }

  // Symptom Severity
  if (symptomSeverity > 0) {
    const impact = symptomSeverity * FEATURE_WEIGHTS.symptomSeverity;
    logOdds += impact;
    contributions.push({
      feature: 'Patient Symptom Severity Rating',
      clinicalValue: `${symptomSeverity}/10`,
      attributionScore: parseFloat(impact.toFixed(3)),
      direction: 'RISK_INCREASING',
      percentageOfRisk: 0,
      explanation: `Patient-reported severity score contributes +${(impact * 10).toFixed(1)}% to triage prioritization.`
    });
  }

  // Comorbidities
  if (chronicConditions && chronicConditions.length > 0) {
    const impact = chronicConditions.length * FEATURE_WEIGHTS.comorbidityWeight;
    logOdds += impact;
    contributions.push({
      feature: 'Documented Comorbidities',
      clinicalValue: `${chronicConditions.join(', ')}`,
      attributionScore: parseFloat(impact.toFixed(3)),
      direction: 'RISK_INCREASING',
      percentageOfRisk: 0,
      explanation: `Documented chronic health condition(s) elevate vulnerability (+${(impact * 10).toFixed(1)}%).`
    });
  }

  // Non-adherence
  if (medicationAdherent === false) {
    const impact = FEATURE_WEIGHTS.nonAdherencePenalty;
    logOdds += impact;
    contributions.push({
      feature: 'Medication Adherence',
      clinicalValue: 'Non-Adherent',
      attributionScore: parseFloat(impact.toFixed(3)),
      direction: 'RISK_INCREASING',
      percentageOfRisk: 0,
      explanation: 'Missed or incomplete prescription doses increase risk of clinical decompensation.'
    });
  }

  const rawRiskProbability = 1 / (1 + Math.exp(-logOdds));

  let riskTier: RiskTier = 'LOW';
  if (rawRiskProbability >= 0.82 || logOdds >= 2.2) {
    riskTier = 'URGENT';
  } else if (rawRiskProbability >= 0.60 || logOdds >= 0.8) {
    riskTier = 'HIGH';
  } else if (rawRiskProbability >= 0.35 || logOdds >= -0.5) {
    riskTier = 'MODERATE';
  }

  contributions.sort((a, b) => b.attributionScore - a.attributionScore);
  const totalAttributionSum = contributions.reduce((acc, c) => acc + c.attributionScore, 0);

  const normalizedContributions: ContributingFactor[] = contributions.map(c => ({
    ...c,
    percentageOfRisk: totalAttributionSum > 0 ? parseFloat(((c.attributionScore / totalAttributionSum) * 100).toFixed(1)) : 0
  }));

  return {
    engine: 'ML_RISK_STRATIFICATION_MODEL',
    modelVersion: 'v2.1-calibrated-prior',
    riskTier,
    confidenceScore: parseFloat((rawRiskProbability * 100).toFixed(1)),
    logOdds: parseFloat(logOdds.toFixed(3)),
    contributingFactors: normalizedContributions,
    clinicalDecisionSupportNotice: 'This system provides clinical decision support and risk prioritization. It does NOT autonomously diagnose disease or replace professional medical judgment. Clinician review required before clinical intervention.'
  };
}

/**
 * Dual Model Comparative Evaluation (Rule-Based NEWS2 vs ML Risk Model)
 */
export function evaluateDualRisk(input: ClinicalRiskInput): DualRiskEvaluation {
  const ruleBased = evaluateRuleBasedNEWS2(input.vitals || {}, input.symptomSeverity || 0);
  const machineLearning = evaluateMLRiskStratification(input);

  const isDivergent = ruleBased.riskTier !== machineLearning.riskTier;

  return {
    studentId: input.studentId,
    timestamp: new Date().toISOString(),
    ruleBasedBaseline: ruleBased,
    machineLearningModel: machineLearning,
    isDivergent,
    recommendedTier: isDivergent
      ? (['URGENT', 'HIGH'].includes(machineLearning.riskTier) ? machineLearning.riskTier : ruleBased.riskTier)
      : machineLearning.riskTier,
    divergenceReason: isDivergent
      ? `Model divergence detected: Rule-based heuristic scored '${ruleBased.riskTier}' (NEWS2: ${ruleBased.totalScore}), while ML multivariate prior classified '${machineLearning.riskTier}' (Confidence: ${machineLearning.confidenceScore}%). Reviewing clinician should inspect contributing feature attributions.`
      : 'Rule-based and Machine Learning risk tiers are in concordant agreement.'
  };
}
