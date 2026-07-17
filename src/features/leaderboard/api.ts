import { backendConfig } from '@/config/backend';

const TIMEOUT_MS = 8000;
const MAX_DAYS = 60;

export type LeaderboardPeriod = 'all' | '7d';
export type LeaderboardEntry = {
  /** Position au classement (1er, 2e…). */
  rank: number;
  pseudo: string;
  avatar: string | null;
  /** Rang de compétence 1-15 (badge), ou null si non classé. */
  rankId: number | null;
  xp: number;
};
export type SyncPayload = {
  deviceId: string;
  pseudo: string;
  days: { date: string; xp: number }[];
  /** Rang de compétence 1-15 à publier au classement (optionnel). */
  rank?: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${backendConfig.baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`http_${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Payload d'envoi : uniquement les 60 derniers jours (fonction pure, testée). */
export function buildSyncPayload(
  deviceId: string,
  pseudo: string,
  activity: { date: string; xp: number }[],
  rank: number | null = null,
  maxDays: number = MAX_DAYS,
): SyncPayload {
  const payload: SyncPayload = { deviceId, pseudo: pseudo.trim(), days: activity.slice(-maxDays) };
  if (rank != null) payload.rank = rank;
  return payload;
}

export async function syncActivity(payload: SyncPayload, token?: string | null): Promise<void> {
  await request('/v1/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchLeaderboard(period: LeaderboardPeriod): Promise<LeaderboardEntry[]> {
  const data = await request<{ entries: LeaderboardEntry[] }>(`/v1/leaderboard?period=${period}`);
  return data.entries;
}
