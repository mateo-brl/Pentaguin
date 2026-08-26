import { getKv, setKv } from '@/db/repositories';

import { reportPlayer } from './api';

/**
 * Modération du contenu généré par les utilisateurs.
 *
 * La seule surface publique de l'app est le pseudo affiché au classement (les
 * avatars viennent d'une liste fermée). La guideline 1.2 d'Apple exige, dès
 * qu'un contenu utilisateur est visible par d'autres, de pouvoir le signaler ET
 * de bloquer son auteur.
 *
 * Le blocage est volontairement LOCAL : il prend effet immédiatement, hors
 * ligne, et n'expose pas la liste des personnes qu'on masque. Le signalement,
 * lui, part au serveur pour être traité.
 */
const BLOCKED_KEY = 'leaderboard_blocked';

function read(): string[] {
  const raw = getKv(BLOCKED_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    // Valeur corrompue : on repart d'une liste vide plutôt que de planter
    // l'écran du classement.
    return [];
  }
}

/** Comparaison insensible à la casse : « Toto » et « toto » sont le même joueur. */
const key = (pseudo: string): string => pseudo.trim().toLowerCase();

export function getBlockedPseudos(): string[] {
  return read();
}

export function isBlocked(pseudo: string): boolean {
  const target = key(pseudo);
  return read().some((value) => key(value) === target);
}

export function blockPseudo(pseudo: string): void {
  const trimmed = pseudo.trim();
  if (!trimmed || isBlocked(trimmed)) return;
  setKv(BLOCKED_KEY, JSON.stringify([...read(), trimmed]));
}

export function unblockPseudo(pseudo: string): void {
  const target = key(pseudo);
  setKv(BLOCKED_KEY, JSON.stringify(read().filter((value) => key(value) !== target)));
}

export function unblockAll(): void {
  setKv(BLOCKED_KEY, '');
}

/** Retire de la liste affichée les joueurs masqués. Fonction pure, testée. */
export function filterBlocked<T extends { pseudo: string }>(entries: T[], blocked: string[]): T[] {
  if (blocked.length === 0) return entries;
  const set = new Set(blocked.map(key));
  return entries.filter((entry) => !set.has(key(entry.pseudo)));
}

/**
 * Signale un pseudo au serveur, puis le masque localement : on ne demande pas à
 * quelqu'un qui vient de signaler un contenu offensant de continuer à le voir
 * en attendant le traitement.
 */
export async function reportAndBlock(pseudo: string, token: string | null): Promise<void> {
  blockPseudo(pseudo);
  await reportPlayer(pseudo, token);
}
