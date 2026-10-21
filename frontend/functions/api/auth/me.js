import { jsonResponse, errorResponse, getAuthCookie, verifyJwt, withErrorLogging } from './_helpers.js';

async function handleMe(context) {
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

export const onRequestGet = withErrorLogging(handleMe, "GET /auth/me");
