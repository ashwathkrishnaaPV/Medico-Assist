import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudentBMIHealth } from '../components/student/StudentBMIHealth';
import { authService } from '../services/authService';
import { healthStore } from '../services/healthStore';
import { aiService } from '../services/aiService';

describe('StudentBMIHealth Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      id: 'u_1',
      name: 'Ashwath',
      email: 'ashwath@sece.ac.in',
      role: 'STUDENT',
      studentId: '24CC006'
    });
    vi.spyOn(healthStore, 'getStudentProfile').mockReturnValue({
      id: 'p_1',
      studentId: '24CC006',
      name: 'Ashwath',
      email: 'ashwath@sece.ac.in',
      dob: '2006-01-01',
      gender: 'Male',
      department: 'CCE',
      year: '2nd Year',
      ugOrPg: 'UG',
      accommodation: 'Hosteller',
      phone: '9876543210',
      bloodGroup: 'O+',
      emergencyContact: { name: 'Parent', relation: 'Father', phone: '9876543211' },
      medicalCentreContact: '0422-123456',
      criticalAllergies: [],
      criticalConditions: [],
      criticalMedications: [],
      heightCm: 175,
      weightKg: 68,
      bmi: 22.2,
      lastUpdated: '2026-11-25T10:00:00Z',
      profileComplete: true
    });
    vi.spyOn(healthStore, 'getVisitsForStudent').mockReturnValue([]);
    vi.spyOn(healthStore, 'subscribe').mockReturnValue(() => {});
    vi.spyOn(healthStore, 'updateStudentMeasurements').mockResolvedValue(undefined as never);
  });

  it('renders BMI speedometer with GREEN SIGNAL and triggers AI Trend Insights', async () => {
    const trendSpy = vi.spyOn(aiService, 'explainVitalsTrends').mockResolvedValue({
      text: 'Your measurements are stable within normal range.',
      source: 'DETERMINISTIC_FALLBACK',
      model: 'CarePlus-Trend-Engine-v3.0',
      disclaimer: 'Informational support only.'
    });

    render(<StudentBMIHealth />);

    expect(screen.getAllByText('GREEN SIGNAL').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /AI Trend Insights/i }));

    await waitFor(() => {
      expect(trendSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Your measurements are stable within normal range\./i)).toBeInTheDocument();
      expect(screen.getByText(/Informational support only\./i)).toBeInTheDocument();
    });
  });
});
