import { jsonResponse, clearAuthCookie } from './_helpers.js';

/**
 * POST /api/auth/logout
 * Clear the auth cookie.
 */
export async function onRequestPost() {
  const response = jsonResponse({ message: 'Logged out.' });
  response.headers.set('Set-Cookie', clearAuthCookie());
  return response;
}
