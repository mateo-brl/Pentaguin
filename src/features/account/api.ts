import { backendConfig } from '@/config/backend';

const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type Session = { token: string; email: string | null };
export type Me = {
  email: string | null;
  providers: string[];
  pseudo: string | null;
  xpTotal: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${backendConfig.baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) throw new ApiError(response.status, data?.error ?? `http_${response.status}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

const post = <T,>(path: string, body: unknown, token?: string | null) =>
  request<T>(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

export const register = (email: string, password: string, deviceId: string) =>
  post<Session>('/v1/auth/register', { email, password, deviceId });

export const login = (email: string, password: string, deviceId: string) =>
  post<Session>('/v1/auth/login', { email, password, deviceId });

export const loginWithApple = (identityToken: string, deviceId: string) =>
  post<Session>('/v1/auth/apple', { identityToken, deviceId });

export const loginWithGoogle = (idToken: string, deviceId: string) =>
  post<Session>('/v1/auth/google', { idToken, deviceId });

export const fetchMe = (token: string) =>
  request<Me>('/v1/me', { headers: { Authorization: `Bearer ${token}` } });

export const setPseudo = (token: string, pseudo: string) =>
  post<{ ok: boolean; pseudo: string }>('/v1/me/pseudo', { pseudo }, token);

export const deleteAccount = (token: string) =>
  request<{ ok: boolean }>('/v1/me', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

export const requestPasswordReset = (email: string) =>
  post<{ ok: boolean }>('/v1/auth/reset-request', { email });

export const resetPassword = (email: string, code: string, newPassword: string) =>
  post<{ ok: boolean }>('/v1/auth/reset', { email, code, newPassword });
