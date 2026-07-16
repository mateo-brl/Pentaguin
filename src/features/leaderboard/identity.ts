import * as Crypto from 'expo-crypto';

import { getKv, setKv } from '@/db/repositories';

const DEVICE_ID_KEY = 'leaderboard_device_id';
const PSEUDO_KEY = 'leaderboard_pseudo';

/** Miroir de la validation serveur (backend/server.mjs). */
export function isValidPseudo(value: string): boolean {
  return /^[\p{L}\p{N} _.-]{3,20}$/u.test(value.trim());
}

/**
 * Identifiant anonyme de participation au classement : UUID cryptographique
 * généré au premier opt-in, stocké localement, jamais lié à une identité.
 */
export function getDeviceId(): string {
  let id = getKv(DEVICE_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    setKv(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getPseudo(): string | null {
  return getKv(PSEUDO_KEY);
}

export function setPseudo(pseudo: string): void {
  setKv(PSEUDO_KEY, pseudo.trim());
}

/**
 * Repart sur une identité anonyme neuve (après déconnexion d'un compte :
 * l'ancienne identité appartient au compte, le serveur la refuse en anonyme).
 */
export function resetLeaderboardIdentity(): void {
  setKv(DEVICE_ID_KEY, Crypto.randomUUID());
  setKv(PSEUDO_KEY, '');
}
