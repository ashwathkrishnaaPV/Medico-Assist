import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginPage } from '../components/auth/LoginPage';
import { authService } from '../services/authService';

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Sign In and Create Account tabs and requires password', () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('e.g. ashwathkrishnaa.pv2024cce@sece.ac.in') as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
    expect(emailInput.required).toBe(true);
    expect(passwordInput.required).toBe(true);
  });

  it('switches to Student Self-Registration and rejects mismatched passwords', () => {
    const onLoginSuccess = vi.fn();
    const registerSpy = vi.spyOn(authService, 'registerUser');
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    fireEvent.click(screen.getByText('Create Account'));
    expect(screen.getByText(/Student Self-Registration/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('e.g. Arjun Sharma'), { target: { value: 'Test Student' } });
    fireEvent.change(screen.getByPlaceholderText('arjun@sece.ac.in'), { target: { value: 'test@sece.ac.in' } });

    const pwFields = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pwFields[0], { target: { value: 'Password123' } });
    fireEvent.change(pwFields[1], { target: { value: 'Mismatch123' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. 19'), { target: { value: '19' } });

    const buttons = screen.getAllByRole('button', { name: /Create Account/i });
    fireEvent.click(buttons[buttons.length - 1]);

    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(registerSpy).not.toHaveBeenCalled();
  });
});
