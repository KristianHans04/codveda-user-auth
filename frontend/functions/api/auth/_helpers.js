/**
 * Shared helpers for the auth API.
 * Includes password hashing (PBKDF2), JWT signing/verification,
 * rate limiting, and response utilities.
 */

// ---------- Response Helpers ----------

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// ---------- Password Hashing (PBKDF2 via WebCrypto) ----------

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr.buffer;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTES * 8
  );
  return `${PBKDF2_ITERATIONS}:${bufToHex(salt)}:${bufToHex(derived)}`;
}

export async function verifyPassword(password, stored) {
  const [iterStr, saltHex, hashHex] = stored.split(':');
  const iterations = parseInt(iterStr, 10);
  const salt = new Uint8Array(hexToBuf(saltHex));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    HASH_BYTES * 8
  );
  return bufToHex(derived) === hashHex;
}

// ---------- JWT (HMAC-SHA256 via WebCrypto) ----------

async function getSigningKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64url(buf) {
  const str = typeof buf === 'string' ? buf : String.fromCharCode(...new Uint8Array(buf));
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(padded);
  return new Uint8Array([...decoded].map((c) => c.charCodeAt(0)));
}

export async function signJwt(payload, secret, expiresInSeconds = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claims = { ...payload, iat: now, exp: now + expiresInSeconds };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(claims));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput));

  return `${signingInput}.${base64url(signature)}`;
}

export async function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, sig] = parts;
  const signingInput = `${header}.${payload}`;

  const key = await getSigningKey(secret);
  const sigBytes = base64urlDecode(sig);
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(signingInput));
  if (!valid) return null;

  const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  if (claims.exp && claims.exp < Math.floor(Date.now() / 1000)) return null;

  return claims;
}

// ---------- Rate Limiting (D1-backed) ----------

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function checkRateLimit(db, email, ip) {
  const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { results } = await db
    .prepare('SELECT COUNT(*) as cnt FROM auth_attempts WHERE email = ? AND attempted_at > ? AND success = 0')
    .bind(email, cutoff)
    .all();

  if (results[0].cnt >= MAX_ATTEMPTS) {
    return { blocked: true, retryAfterMinutes: WINDOW_MINUTES };
  }
  return { blocked: false };
}

export async function recordAttempt(db, email, ip, success) {
  await db
    .prepare('INSERT INTO auth_attempts (email, ip_address, success) VALUES (?, ?, ?)')
    .bind(email, ip, success ? 1 : 0)
    .run();
}

// ---------- Cookie Helpers ----------

export function setAuthCookie(token, maxAge = 3600) {
  return `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearAuthCookie() {
  return 'auth_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

export function getAuthCookie(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/auth_token=([^;]+)/);
  return match ? match[1] : null;
}

// ---------- Input Validation ----------

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
