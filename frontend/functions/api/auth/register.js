import {
  jsonResponse, errorResponse, hashPassword, normalizeEmail,
  validateEmail, setAuthCookie, signJwt,
} from './_helpers.js';

/**
 * POST /api/auth/register
 * Create a new user account.
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;

  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400);
  }

  const { email: rawEmail, password, display_name } = body;

  if (!rawEmail || !password || !display_name) {
    return errorResponse('Email, password, and display name are required.', 400);
  }

  if (!validateEmail(rawEmail)) {
    return errorResponse('Invalid email format.', 400);
  }

  if (typeof password !== 'string' || password.length < 8) {
    return errorResponse('Password must be at least 8 characters.', 400);
  }

  if (typeof display_name !== 'string' || display_name.trim().length < 1 || display_name.trim().length > 100) {
    return errorResponse('Display name must be between 1 and 100 characters.', 400);
  }

  const email = normalizeEmail(rawEmail);

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return errorResponse('An account with this email already exists.', 409);
  }

  const id = crypto.randomUUID();
  const password_hash = await hashPassword(password);

  await db
    .prepare('INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)')
    .bind(id, email, password_hash, display_name.trim())
    .run();

  const token = await signJwt({ sub: id, email }, env.JWT_SECRET, 3600);

  const response = jsonResponse(
    { user: { id, email, display_name: display_name.trim() } },
    201
  );
  response.headers.set('Set-Cookie', setAuthCookie(token));
  return response;
}
