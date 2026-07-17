/**
 * Avatar « intégré » : ni photo, ni upload, ni dépendance native. Un avatar est
 * juste une icône (ou les initiales) sur une pastille teintée, sérialisé en
 * « <icône>.<teinte> » (ex. shield.3) et stocké côté compte. Miroir de la
 * validation serveur (backend/server.mjs : AVATAR_ICONS, teinte 0-4).
 */
export const AVATAR_ICONS = [
  'initials',
  'shield',
  'terminal',
  'bug',
  'fingerprint',
  'lock',
  'flash',
  'rocket',
] as const;

export type AvatarIcon = (typeof AVATAR_ICONS)[number];

/** Nombre de teintes disponibles (aligné sur Hues, src/constants/theme.ts). */
export const AVATAR_COLORS = 5;

export type AvatarSpec = { icon: AvatarIcon; color: number };

const IONICON: Record<Exclude<AvatarIcon, 'initials'>, string> = {
  shield: 'shield',
  terminal: 'terminal',
  bug: 'bug',
  fingerprint: 'finger-print',
  lock: 'lock-closed',
  flash: 'flash',
  rocket: 'rocket',
};

/** Nom Ionicons de l'icône, ou null si l'avatar affiche des initiales. */
export function ioniconFor(icon: AvatarIcon): string | null {
  return icon === 'initials' ? null : IONICON[icon];
}

export function serializeAvatar(spec: AvatarSpec): string {
  return `${spec.icon}.${spec.color}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash;
}

/** Avatar par défaut déterministe, dérivé du pseudo (avant tout choix explicite). */
export function defaultAvatar(pseudo: string): AvatarSpec {
  return { icon: 'initials', color: hashString(pseudo || 'P') % AVATAR_COLORS };
}

export function parseAvatar(value: string | null | undefined, pseudo: string): AvatarSpec {
  if (value) {
    const match = /^([a-z]+)\.([0-4])$/.exec(value);
    if (match && (AVATAR_ICONS as readonly string[]).includes(match[1])) {
      return { icon: match[1] as AvatarIcon, color: Number(match[2]) };
    }
  }
  return defaultAvatar(pseudo);
}

export function initials(pseudo: string): string {
  const trimmed = (pseudo ?? '').trim();
  if (!trimmed) return 'P';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}
