import { jsonResponse, errorResponse, getAuthCookie, verifyJwt } from './_helpers.js';

/**
 * GET /api/auth/me
 * Return the authenticated user's profile from the JWT cookie.
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;

  const token = getAuthCookie(request);
  if (!token) {
    return errorResponse('Not authenticated.', 401);
  }

  const claims = await verifyJwt(token, env.JWT_SECRET);
  if (!claims) {
    return errorResponse('Session expired. Please log in again.', 401);
  }

  const user = await db
    .prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?')
    .bind(claims.sub)
    .first();

  if (!user) {
    return errorResponse('User not found.', 404);
  }

  return jsonResponse({ user });
}
