import { AppState } from 'react-native';

import { backendConfig } from '@/config/backend';
import { getToken } from '@/features/account/token';

import { emptySnapshot, mergeSnapshots, type Snapshot } from './merge';
import { applySnapshot, snapshotFromDb } from './snapshot';

/**
 * Cloud save : sauvegarde/restauration de la progression liée AU COMPTE. Tout
 * est offline-first et non bloquant : la moindre erreur réseau est silencieuse,
 * la progression locale reste la source vivante.
 */
const TIMEOUT_MS = 8000;

async function api(method: 'GET' | 'PUT', token: string, body?: Snapshot): Promise<Snapshot | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${backendConfig.baseUrl}/v1/progress`, {
      method,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) return null;
    return (await res.json()) as Snapshot;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * À la connexion / au démarrage authentifié : récupère la progression du compte,
 * la fusionne dans le local (union/max, jamais de régression), puis renvoie le
 * résultat fusionné au serveur. C'est ce qui restaure tout après une
 * réinstallation ou sur un nouvel appareil.
 */
export async function pullMergeProgress(): Promise<void> {
  const token = await getToken();
  if (!token) return;
  try {
    const remote = await api('GET', token);
    const merged = mergeSnapshots(remote ?? emptySnapshot(), snapshotFromDb()); // local = plus frais
    applySnapshot(merged);
    await api('PUT', token, merged);
  } catch {
    // hors-ligne : on réessaiera au prochain démarrage / passage en arrière-plan
  }
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

/** Sauvegarde immédiate (best-effort). Le serveur fusionne son côté. */
export async function pushNow(): Promise<void> {
  const token = await getToken();
  if (!token) return;
  try {
    await api('PUT', token, snapshotFromDb());
  } catch {
    // silencieux
  }
}

/** Sauvegarde différée (regroupe les changements rapprochés). */
export function schedulePush(): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushNow(), 3000);
}

/**
 * Sauvegarde quand l'app passe en arrière-plan : filet de sécurité qui capture
 * tout le travail de la session. Renvoie une fonction de désabonnement.
 */
export function installCloudSave(): () => void {
  const sub = AppState.addEventListener('change', (state) => {
    if (state !== 'active') void pushNow();
  });
  return () => sub.remove();
}
