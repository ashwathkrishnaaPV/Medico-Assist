import axios, { AxiosError, AxiosResponse } from 'axios';

export interface ApiSuccessEnvelope<T = unknown> {
  success: true;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiErrorEnvelope {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  message?: string;
}

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);
let inMemoryCsrfToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setCsrfToken(token: string | null): void {
  inMemoryCsrfToken = token;
}

export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const cookies = document.cookie.split(';');
  for (const part of cookies) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${name}=`)) continue;
    try {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    } catch {
      return trimmed.slice(name.length + 1);
    }
  }
  return null;
}

export function extractApiError(err: unknown, fallback = 'An unexpected error occurred.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorEnvelope | undefined;
    const message = data?.error?.message || data?.message;
    if (message) return message;
    if (err.response?.status === 429) return 'Too many requests. Please wait and try again.';
    if (!err.response && err.message) return 'Network error. Please check your connection.';
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function unwrapData<T>(res: AxiosResponse<ApiSuccessEnvelope<T> | T>): T {
  const payload = res.data as ApiSuccessEnvelope<T> | T;
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as ApiSuccessEnvelope<T>).data;
  }
  return payload as T;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-CSRF-TOKEN',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach CSRF token on state-changing requests (HttpOnly JWT cookie is sent automatically)
api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (MUTATING_METHODS.has(method)) {
    const csrfToken = readCookie('XSRF-TOKEN') || inMemoryCsrfToken;
    if (csrfToken) {
      config.headers.set('X-CSRF-TOKEN', csrfToken);
    }
  }
  return config;
});

// Handle session expiry and extract CSRF tokens returned in auth responses
api.interceptors.response.use(
  (res) => {
    const data = (res.data as { data?: { csrfToken?: string }; csrfToken?: string } | undefined);
    const token = data?.data?.csrfToken || data?.csrfToken;
    if (token) {
      inMemoryCsrfToken = token;
    }
    return res;
  },
  (err: AxiosError) => {
    const status = err.response?.status;
    const url = err.config?.url || '';
    const isAuthProbe = url.includes('/auth/me') || url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401) {
      // Scrub legacy localStorage items if present from pre-cookie sessions
      localStorage.removeItem('campushealth_token');
      localStorage.removeItem('campushealth_user');
      if (!isAuthProbe && unauthorizedHandler) {
        unauthorizedHandler();
      }
    }
    return Promise.reject(err);
  }
);

export default api;
