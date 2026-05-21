import {
  jsonResponse, errorResponse, verifyPassword, normalizeEmail,
  validateEmail, setAuthCookie, signJwt,
  checkRateLimit, recordAttempt,
} from './_helpers.js';

/**
 * POST /api/auth/login
 * Authenticate and receive a JWT in an HTTP-only cookie.
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

  const { email: rawEmail, password } = body;

  if (!rawEmail || !password) {
    return errorResponse('Email and password are required.', 400);
  }

  if (!validateEmail(rawEmail)) {
    return errorResponse('Invalid email format.', 400);
  }

  const email = normalizeEmail(rawEmail);
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';

  // Check rate limiting
  const limit = await checkRateLimit(db, email, ip);
  if (limit.blocked) {
    return errorResponse(
      `Too many login attempts. Try again in ${limit.retryAfterMinutes} minutes.`,
      429
    );
  }

  // Find user
  const user = await db.prepare('SELECT id, email, password_hash, display_name FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    await recordAttempt(db, email, ip, false);
    return errorResponse('Invalid email or password.', 401);
  }

  // Verify password
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    await recordAttempt(db, email, ip, false);
    return errorResponse('Invalid email or password.', 401);
  }

  await recordAttempt(db, email, ip, true);

  const token = await signJwt({ sub: user.id, email: user.email }, env.JWT_SECRET, 3600);

  const response = jsonResponse({
    user: { id: user.id, email: user.email, display_name: user.display_name },
  });
  response.headers.set('Set-Cookie', setAuthCookie(token));
  return response;
}
