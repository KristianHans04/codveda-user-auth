/**
 * OAuth helper utilities shared by all provider callbacks.
 * Handles state validation, user upsert, and session creation.
 */
import { signJwt, setAuthCookie, jsonResponse, errorResponse } from '../_helpers.js';

/** Generate a random state string for CSRF protection */
export function generateState() {
  const arr = crypto.getRandomValues(new Uint8Array(16));
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Store state in a short-lived cookie */
export function setStateCookie(state) {
  return `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

/** Read state from cookie */
export function getStateCookie(request) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/oauth_state=([^;]+)/);
  return m ? m[1] : null;
}

/** Clear state cookie */
export function clearStateCookie() {
  return 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}

/**
 * Find existing user by OAuth provider, or by email, or create new.
 * Returns the user row after upsert.
 */
export async function upsertOAuthUser(db, { provider, providerUserId, email, displayName, avatarUrl }) {
  // 1. Check if oauth_account already exists
  const existing = await db
    .prepare('SELECT u.* FROM oauth_accounts oa JOIN users u ON oa.user_id = u.id WHERE oa.provider = ? AND oa.provider_user_id = ?')
    .bind(provider, providerUserId)
    .first();
  if (existing) return existing;

  let user = null;

  // 2. Try to find by email to merge accounts
  if (email) {
    user = await db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email.trim().toLowerCase())
      .first();
  }

  // 3. Create user if not found
  if (!user) {
    const id = crypto.randomUUID();
    await db
      .prepare('INSERT INTO users (id, email, display_name, avatar_url) VALUES (?, ?, ?, ?)')
      .bind(id, email ? email.trim().toLowerCase() : null, displayName, avatarUrl || null)
      .run();
    user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  }

  // 4. Link oauth_account to user
  const oauthId = crypto.randomUUID();
  await db
    .prepare('INSERT OR IGNORE INTO oauth_accounts (id, user_id, provider, provider_user_id, provider_email) VALUES (?, ?, ?, ?, ?)')
    .bind(oauthId, user.id, provider, providerUserId, email || null)
    .run();

  return user;
}

/** Create session response with JWT cookie and redirect to dashboard */
export async function createOAuthSession(user, jwtSecret) {
  const token = await signJwt({ sub: user.id, email: user.email }, jwtSecret, 3600 * 24 * 7); // 7 day session
  const headers = new Headers({
    Location: '/dashboard',
    'Set-Cookie': setAuthCookie(token, 3600 * 24 * 7),
  });
  // Clear state cookie
  headers.append('Set-Cookie', clearStateCookie());
  return new Response(null, { status: 302, headers });
}

export function oauthErrorRedirect(message) {
  return Response.redirect(`/login?error=${encodeURIComponent(message)}`, 302);
}
