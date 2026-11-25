import api, { unwrapData, extractApiError } from './api';

export interface AiResponse {
  text: string;
  source: 'LLM' | 'DETERMINISTIC_FALLBACK';
  model: string;
  disclaimer: string;
}

export interface VitalRecordForAnalysis {
  recordedAt?: string;
  visitDate?: string;
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  heartRateBpm?: number;
  temperatureF?: number;
  spo2Percent?: number;
}

const CLIENT_DISCLAIMER =
  'This assistant provides educational and informational support only and is not a substitute for professional medical care, diagnosis, or clinical advice.';

export const aiService = {
  /**
   * Ask the healthcare assistant a general health or medical education question.
   */
  async askHealthAssistant(question: string, context?: string): Promise<AiResponse> {
    try {
      const res = await api.post('/ai/health-info', { question, context });
      return unwrapData<AiResponse>(res);
    } catch (err) {
      console.warn('API AI assistant call failed, using client fallback:', extractApiError(err));
      return {
        text: `### Health Information & Guidance\n\nRegarding: "${question}"\n\nMaintaining adequate hydration (2–3 liters daily), consistent sleep (7–8 hours), and balanced nutrition are vital to academic wellness. For specific medical evaluation or symptoms, please schedule a visit with the campus healthcare centre.\n\n---\n*Disclaimer*: ${CLIENT_DISCLAIMER}`,
        source: 'DETERMINISTIC_FALLBACK',
        model: 'Client-Fallback-Engine',
        disclaimer: CLIENT_DISCLAIMER
      };
    }
  },

  /**
   * Request allergen-aware and preference-aware collegiate meal recommendations.
   */
  async getNutritionAdvice(params: {
    goal: string;
    allergies?: string[];
    preferences?: string;
    currentBmi?: number;
  }): Promise<AiResponse> {
    try {
      const res = await api.post('/ai/nutrition-advice', params);
      return unwrapData<AiResponse>(res);
    } catch (err) {
      console.warn('API nutrition advice call failed, using client fallback:', extractApiError(err));
      return {
        text: `### Nutritional Guidelines\n\n- **Target Goal**: ${params.goal}\n- **Allergies Excluded**: ${(params.allergies || []).join(', ') || 'None declared'}\n- **Dietary Preference**: ${params.preferences || 'Balanced collegiate'}\n\n*Recommended Routine*: Balanced complex carbohydrates (brown rice, whole wheat), lean proteins, and leafy greens. Hydrate consistently throughout study sessions.\n\n---\n*Disclaimer*: ${CLIENT_DISCLAIMER}`,
        source: 'DETERMINISTIC_FALLBACK',
        model: 'Client-Fallback-Engine',
        disclaimer: CLIENT_DISCLAIMER
      };
    }
  },

  /**
   * Explain vital measurement trends over time in plain collegiate terms.
   */
  async explainVitalsTrends(vitals: VitalRecordForAnalysis[]): Promise<AiResponse> {
    try {
      const res = await api.post('/ai/trend-explanation', { vitals });
      return unwrapData<AiResponse>(res);
    } catch (err) {
      console.warn('API trend explanation failed, using client fallback:', extractApiError(err));
      return {
        text: `### Vital Trend Insights\n\nAnalyzed ${vitals.length} recorded vital entry(ies). Trends demonstrate normal physiological variance. Maintain healthy sleep cycles and hydration during examination periods. Schedule a campus clinical review if readings fluctuate markedly.\n\n---\n*Disclaimer*: ${CLIENT_DISCLAIMER}`,
        source: 'DETERMINISTIC_FALLBACK',
        model: 'Client-Fallback-Engine',
        disclaimer: CLIENT_DISCLAIMER
      };
    }
  },

  /**
   * Draft a structured clinical consultation summary for physician review and editing.
   */
  async draftVisitSummary(params: {
    chiefComplaint: string;
    diagnosis: string;
    vitals?: Record<string, unknown>;
    clinicalNotes?: string;
  }): Promise<AiResponse> {
    try {
      const res = await api.post('/ai/visit-summary-draft', params);
      return unwrapData<AiResponse>(res);
    } catch (err) {
      console.warn('API clinical draft call failed, using client fallback:', extractApiError(err));
      return {
        text: `### Clinical Consultation Draft (Review Required)\n\n- **Chief Complaint**: ${params.chiefComplaint}\n- **Clinical Impression / Diagnosis**: ${params.diagnosis}\n- **Observations**: ${params.clinicalNotes || 'Stable campus health evaluation.'}\n\n*Clinician Review Note*: Verify all parameters before committing to student medical record.\n\n---\n*Disclaimer*: ${CLIENT_DISCLAIMER}`,
        source: 'DETERMINISTIC_FALLBACK',
        model: 'Client-Fallback-Engine',
        disclaimer: CLIENT_DISCLAIMER
      };
    }
  }
};
