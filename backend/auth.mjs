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

// — Jeton de défi 2FA (court, entre le mot de passe et le code TOTP) -------------

/** Jeton éphémère (5 min) prouvant « mot de passe OK, TOTP restant à fournir ». */
export function signMfaToken(userId, secret) {
  const header = toB64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = toB64url(JSON.stringify({ sub: userId, mfa: 1, iat: now, exp: now + 300 }));
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

// — TOTP (RFC 6238, HMAC-SHA1, 30 s, 6 chiffres) ---------------------------------

const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += B32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input) {
  const clean = String(input).toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output = [];
  for (const char of clean) {
    value = (value << 5) | B32_ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function hotp(secretBuffer, counter) {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', secretBuffer).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return (binary % 1_000_000).toString().padStart(6, '0');
}

/** Secret TOTP neuf, en base32 (format attendu par les apps d'authentification). */
export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

/** Vérifie un code à ±1 fenêtre de 30 s (tolérance à la dérive d'horloge). */
export function verifyTotp(base32Secret, code, window = 1) {
  const candidate = String(code ?? '').trim();
  if (!/^\d{6}$/.test(candidate)) return false;
  const secret = base32Decode(base32Secret);
  const counter = Math.floor(Date.now() / 1000 / 30);
  for (let i = -window; i <= window; i += 1) {
    if (hotp(secret, counter + i) === candidate) return true;
  }
  return false;
}

/** URI otpauth:// (deep link + QR standard) pour l'app d'authentification. */
export function otpauthUri(base32Secret, account, issuer = 'Pentaguin') {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const query =
    `secret=${base32Secret}` +
    `&issuer=${encodeURIComponent(issuer)}` +
    `&algorithm=SHA1&digits=6&period=30`;
  return `otpauth://totp/${label}?${query}`;
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
