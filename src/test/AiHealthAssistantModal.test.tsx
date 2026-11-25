import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiHealthAssistantModal } from '../components/common/AiHealthAssistantModal';
import { aiService } from '../services/aiService';

describe('AiHealthAssistantModal Component', () => {
  it('displays non-diagnostic safety banner and answers quick prompts', async () => {
    const spy = vi.spyOn(aiService, 'askHealthAssistant').mockResolvedValue({
      text: 'Normal adult blood pressure is around 120/80 mmHg.',
      source: 'DETERMINISTIC_FALLBACK',
      model: 'CarePlus-Rule-Engine-v3.0',
      disclaimer: 'Educational only.'
    });

    render(<AiHealthAssistantModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Non-Diagnostic Notice:/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('What is considered a normal blood pressure reading?'));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Normal adult blood pressure is around 120\/80 mmHg\./i)).toBeInTheDocument();
    });
  });
});
