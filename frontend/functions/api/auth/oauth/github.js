import { generateState, setStateCookie } from './_oauth_helpers.js';

/**
 * GET /api/auth/oauth/github
 * Redirect the user to GitHub's OAuth authorization page.
 */
export async function onRequestGet(context) {
  const { env } = context;
  const state = generateState();
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${env.APP_URL}/api/auth/oauth/github/callback`,
    scope: 'read:user user:email',
    state,
  });
  const headers = new Headers({
    Location: `https://github.com/login/oauth/authorize?${params}`,
    'Set-Cookie': setStateCookie(state),
  });
  return new Response(null, { status: 302, headers });
}
