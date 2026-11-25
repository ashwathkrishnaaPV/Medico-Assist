import api, { extractApiError, setCsrfToken, setUnauthorizedHandler, unwrapData } from './api';
import { User, Role } from '../types';

export interface StudentRegistrationPayload {
  name: string;
  email: string;
  password: string;
  studentId?: string;
  department?: string;
  phone?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  year?: string;
}

class AuthService {
  private currentUser: User | null = null;
  private authenticated = false;
  private initialized = false;
  private initPromise: Promise<User | null> | null = null;
  private listeners: Array<(user: User | null, authenticated: boolean) => void> = [];

  constructor() {
    // Scrub any legacy plaintext tokens from localStorage
    try {
      localStorage.removeItem('campushealth_token');
      localStorage.removeItem('campushealth_user');
    } catch {
      // Ignore storage access errors in restricted environments
    }

    setUnauthorizedHandler(() => {
      this.resetLocalAuthState();
    });
  }

  private mapUser(raw: Record<string, unknown>): User {
    const id = String(raw.id || raw._id || '');
    return {
      ...(raw as unknown as User),
      id,
    };
  }

  private setSession(user: User, csrfToken?: string | null) {
    if (csrfToken) {
      setCsrfToken(csrfToken);
    }
    this.currentUser = user;
    this.authenticated = true;
    this.initialized = true;
    this.notify();
  }

  private resetLocalAuthState() {
    setCsrfToken(null);
    this.currentUser = null;
    this.authenticated = false;
    this.initialized = true;
    try {
      localStorage.removeItem('campushealth_token');
      localStorage.removeItem('campushealth_user');
    } catch {
      // Ignore
    }
    this.notify();
  }

  /**
   * Restore authenticated session from HttpOnly server cookie on startup.
   */
  async initSession(): Promise<User | null> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        await api.get('/auth/csrf-token').catch(() => undefined);
        const res = await api.get('/auth/me');
        const payload = unwrapData<{ user: Record<string, unknown>; csrfToken?: string }>(res);
        if (payload?.user) {
          const mapped = this.mapUser(payload.user);
          this.setSession(mapped, payload.csrfToken);
          return mapped;
        }
        this.resetLocalAuthState();
        return null;
      } catch {
        this.resetLocalAuthState();
        return null;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getCurrentUser(): User {
    if (!this.currentUser) {
      return { id: '', name: 'Guest User', email: '', role: 'STUDENT', studentId: '' };
    }
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.authenticated && !!this.currentUser;
  }

  async registerUser(userData: StudentRegistrationPayload & { role?: Role; staffId?: string; title?: string }): Promise<User> {
    const payload: StudentRegistrationPayload = {
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      studentId: userData.studentId?.trim() || undefined,
      department: userData.department?.trim() || undefined,
      phone: userData.phone?.trim() || undefined,
      age: userData.age,
      gender: userData.gender,
      year: userData.year,
    };

    const res = await api.post('/auth/register', payload);
    const data = unwrapData<{ user: Record<string, unknown>; csrfToken?: string }>(res);
    const mapped = this.mapUser(data.user);
    this.setSession(mapped, data.csrfToken);
    return mapped;
  }

  async login(email: string, password: string): Promise<User> {
    if (!email.trim() || !password) {
      throw new Error('Email and password are required.');
    }
    const res = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    const data = unwrapData<{ user: Record<string, unknown>; csrfToken?: string }>(res);
    const mapped = this.mapUser(data.user);
    this.setSession(mapped, data.csrfToken);
    return mapped;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (err) {
      return { success: false, error: extractApiError(err, 'Failed to change password.') };
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const res = await api.get('/auth/users');
      const users = unwrapData<Record<string, unknown>[]>(res);
      return Array.isArray(users) ? users.map((u) => this.mapUser(u)) : [];
    } catch {
      return [];
    }
  }

  async getMedicalStaff(): Promise<User[]> {
    try {
      const res = await api.get('/auth/staff');
      const staff = unwrapData<Record<string, unknown>[]>(res);
      return Array.isArray(staff) ? staff.map((u) => this.mapUser(u)) : [];
    } catch {
      return [];
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors when clearing session client-side
    } finally {
      this.resetLocalAuthState();
    }
  }

  async switchRole(_role: Role): Promise<User> {
    return this.getCurrentUser();
  }

  setUser(user: User): void {
    this.currentUser = user;
    this.authenticated = true;
    this.notify();
  }

  subscribe(listener: (user: User | null, authenticated: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.currentUser, this.authenticated));
  }

  hasRole(role: Role): boolean {
    return this.authenticated && this.currentUser?.role === role;
  }

  clearAllAuthData(): void {
    void this.logout();
  }
}

export const authService = new AuthService();
