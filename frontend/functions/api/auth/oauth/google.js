import { generateState, setStateCookie } from './_oauth_helpers.js';

/**
 * GET /api/auth/oauth/google
 * Redirect the user to Google's OAuth authorization page.
 */
export async function onRequestGet(context) {
  const { env } = context;
  const state = generateState();
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: `${env.APP_URL}/api/auth/oauth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  const headers = new Headers({
    Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    'Set-Cookie': setStateCookie(state),
  });
  return new Response(null, { status: 302, headers });
}
