import { describe, it, expect } from 'vitest';
import { AxiosResponse } from 'axios';
import { unwrapData, extractApiError } from '../services/api';

describe('API Service Helpers', () => {
  it('unwraps standardized { success, data } API envelopes', () => {
    const fakeResponse = {
      data: { success: true, message: 'OK', data: { id: 'stu_1', name: 'Ashwath' } }
    } as AxiosResponse;
    expect(unwrapData(fakeResponse)).toEqual({ id: 'stu_1', name: 'Ashwath' });
  });

  it('returns raw payload if response is not wrapped in an envelope', () => {
    const fakeResponse = {
      data: [{ id: '1' }]
    } as AxiosResponse;
    expect(unwrapData(fakeResponse)).toEqual([{ id: '1' }]);
  });

  it('extracts Error message cleanly and falls back gracefully', () => {
    expect(extractApiError(new Error('Invalid credentials'))).toBe('Invalid credentials');
    expect(extractApiError(null, 'Fallback message')).toBe('Fallback message');
  });
});
