import api from './api';
import { User, Role } from '../types';

class AuthService {
  private currentUser: User | null = null;
  private authenticated: boolean = false;
  private listeners: Array<(user: User | null, authenticated: boolean) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const token = localStorage.getItem('campushealth_token');
      const savedUser = localStorage.getItem('campushealth_user');
      if (token && savedUser) {
        this.currentUser = JSON.parse(savedUser);
        this.authenticated = true;
      }
    } catch {
      this.currentUser = null;
      this.authenticated = false;
    }
  }

  private persist(token: string, user: User) {
    localStorage.setItem('campushealth_token', token);
    localStorage.setItem('campushealth_user', JSON.stringify(user));
    this.currentUser = user;
    this.authenticated = true;
    this.notify();
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

  async registerUser(userData: { name: string; email: string; password?: string; role: Role; studentId?: string; staffId?: string; department?: string; title?: string }): Promise<User> {
    const res = await api.post('/auth/register', userData);
    const { token, user } = res.data;
    this.persist(token, { ...user, id: user.id || user._id });
    return this.currentUser!;
  }

  async login(email: string, password?: string): Promise<User | null> {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    const mapped: User = { ...user, id: user.id || user._id };
    this.persist(token, mapped);
    return mapped;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error || 'Failed to change password.' };
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const res = await api.get('/auth/users');
      return res.data.map((u: any) => ({ ...u, id: u.id || u._id }));
    } catch {
      return [];
    }
  }

  logout(): void {
    localStorage.removeItem('campushealth_token');
    localStorage.removeItem('campushealth_user');
    this.currentUser = null;
    this.authenticated = false;
    this.notify();
  }

  // Kept for role switching in dev (uses API)
  async switchRole(role: Role): Promise<User> {
    // No-op in production - kept for interface compatibility
    return this.currentUser!;
  }

  setUser(user: User): void {
    this.currentUser = user;
    this.authenticated = true;
    localStorage.setItem('campushealth_user', JSON.stringify(user));
    this.notify();
  }

  subscribe(listener: (user: User | null, authenticated: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify() {
    this.listeners.forEach(l => l(this.currentUser, this.authenticated));
  }

  hasRole(role: Role): boolean {
    return this.authenticated && this.currentUser?.role === role;
  }

  clearAllAuthData(): void {
    localStorage.removeItem('campushealth_token');
    localStorage.removeItem('campushealth_user');
    this.currentUser = null;
    this.authenticated = false;
    this.notify();
  }
}

export const authService = new AuthService();
