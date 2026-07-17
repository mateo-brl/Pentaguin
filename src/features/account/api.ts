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
export type MfaChallenge = { mfaRequired: true; mfaToken: string };
export type VerifyChallenge = { verifyRequired: true; verifyToken: string };
export type LoginResult = Session | MfaChallenge | VerifyChallenge;
export type Me = {
  email: string | null;
  providers: string[];
  pseudo: string | null;
  avatar: string | null;
  twoFactor: boolean;
  xpTotal: number;
};

export function isMfaChallenge(result: LoginResult): result is MfaChallenge {
  return 'mfaRequired' in result && result.mfaRequired === true;
}

export function isVerifyChallenge(result: LoginResult): result is VerifyChallenge {
  return 'verifyRequired' in result && result.verifyRequired === true;
}

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
  post<LoginResult>('/v1/auth/register', { email, password, deviceId });

export const login = (email: string, password: string, deviceId: string) =>
  post<LoginResult>('/v1/auth/login', { email, password, deviceId });

export const verify2fa = (mfaToken: string, code: string) =>
  post<Session>('/v1/auth/2fa', { mfaToken, code });

export const verifyEmail = (verifyToken: string, code: string) =>
  post<Session>('/v1/auth/verify-email', { verifyToken, code });

export const resendVerification = (verifyToken: string) =>
  post<{ ok: boolean }>('/v1/auth/resend-verification', { verifyToken });

export const loginWithApple = (identityToken: string, deviceId: string) =>
  post<Session>('/v1/auth/apple', { identityToken, deviceId });

export const loginWithGoogle = (idToken: string, deviceId: string) =>
  post<Session>('/v1/auth/google', { idToken, deviceId });

export const fetchMe = (token: string) =>
  request<Me>('/v1/me', { headers: { Authorization: `Bearer ${token}` } });

export const setPseudo = (token: string, pseudo: string) =>
  post<{ ok: boolean; pseudo: string }>('/v1/me/pseudo', { pseudo }, token);

export const setAvatar = (token: string, avatar: string) =>
  post<{ ok: boolean; avatar: string }>('/v1/me/avatar', { avatar }, token);

export const changePassword = (token: string, currentPassword: string, newPassword: string) =>
  post<{ ok: boolean }>('/v1/me/password', { currentPassword, newPassword }, token);

export const setup2fa = (token: string) =>
  post<{ secret: string; otpauth: string }>('/v1/me/2fa/setup', {}, token);

export const enable2fa = (token: string, code: string) =>
  post<{ ok: boolean; twoFactor: boolean }>('/v1/me/2fa/enable', { code }, token);

export const disable2fa = (token: string, code: string) =>
  post<{ ok: boolean; twoFactor: boolean }>('/v1/me/2fa/disable', { code }, token);

export const deleteAccount = (token: string) =>
  request<{ ok: boolean }>('/v1/me', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

export const requestPasswordReset = (email: string) =>
  post<{ ok: boolean }>('/v1/auth/reset-request', { email });

export const resetPassword = (email: string, code: string, newPassword: string) =>
  post<{ ok: boolean }>('/v1/auth/reset', { email, code, newPassword });
