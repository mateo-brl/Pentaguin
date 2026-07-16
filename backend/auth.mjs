/**
 * Primitives d'authentification — zéro dépendance (node:crypto uniquement).
 * - Mots de passe : scrypt + sel aléatoire, comparaison à temps constant.
 * - Sessions : JWT HS256 signé avec JWT_SECRET (env serveur, jamais en repo).
 * - Identity tokens Apple/Google : vérification RS256 contre leurs JWKS
 *   publics (cache 6 h), contrôle iss / aud / exp.
 */
import {
  createHmac,
  createPublicKey,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  verify as cryptoVerify,
} from 'node:crypto';

const fromB64url = (value) => Buffer.from(value, 'base64url');
const toB64url = (value) => Buffer.from(value).toString('base64url');

// — Mots de passe --------------------------------------------------------------

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHashHex) {
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHashHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// — Sessions JWT (HS256) --------------------------------------------------------

const SESSION_TTL_SECONDS = 180 * 86_400; // 6 mois

export function signSession(userId, secret) {
  const header = toB64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = toB64url(
    JSON.stringify({ sub: userId, iat: now, exp: now + SESSION_TTL_SECONDS }),
  );
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifySession(token, secret) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
  const actual = fromB64url(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const claims = JSON.parse(fromB64url(payload).toString('utf-8'));
    if (typeof claims.sub !== 'string') return null;
    if (typeof claims.exp !== 'number' || claims.exp < Date.now() / 1000) return null;
    return claims;
  } catch {
    return null;
  }
}

// — Identity tokens Apple / Google (RS256 + JWKS) --------------------------------

const jwksCache = new Map(); // url → { keys, fetchedAt }
const JWKS_TTL_MS = 6 * 3_600_000;

async function getJwks(url) {
  const cached = jwksCache.get(url);
  if (cached && Date.now() - cached.fetchedAt < JWKS_TTL_MS) return cached.keys;
  const response = await fetch(url);
  if (!response.ok) throw new Error('jwks_fetch_failed');
  const { keys } = await response.json();
  jwksCache.set(url, { keys, fetchedAt: Date.now() });
  return keys;
}

export async function verifyIdentityToken(token, { jwksUrl, issuers, audiences }) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;

  let header;
  let payload;
  try {
    header = JSON.parse(fromB64url(parts[0]).toString('utf-8'));
    payload = JSON.parse(fromB64url(parts[1]).toString('utf-8'));
  } catch {
    return null;
  }

  const keys = await getJwks(jwksUrl);
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) return null;

  const publicKey = createPublicKey({ key: jwk, format: 'jwk' });
  const valid = cryptoVerify(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    publicKey,
    fromB64url(parts[2]),
  );
  if (!valid) return null;

  if (!issuers.includes(payload.iss)) return null;
  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audience.some((value) => audiences.includes(value))) return null;
  if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return null;

  return payload;
}
