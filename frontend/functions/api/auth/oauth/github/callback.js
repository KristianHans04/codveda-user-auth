import { getStateCookie, upsertOAuthUser, createOAuthSession, oauthErrorRedirect } from '../_oauth_helpers.js';

/**
 * GET /api/auth/oauth/github/callback
 * Exchange GitHub authorization code for user data, create session.
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = getStateCookie(request);

  if (!code || !state || state !== storedState) {
    return oauthErrorRedirect('Invalid OAuth state. Please try again.');
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${env.APP_URL}/api/auth/oauth/github/callback`,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return oauthErrorRedirect('GitHub authentication failed. Please try again.');
  }

  // Fetch user profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'Codveda-Auth/1.0' },
  });
  const ghUser = await userRes.json();

  // Fetch primary email if not public
  let email = ghUser.email;
  if (!email) {
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'Codveda-Auth/1.0' },
    });
    const emails = await emailRes.json();
    const primary = emails.find((e) => e.primary && e.verified);
    email = primary ? primary.email : null;
  }

  const user = await upsertOAuthUser(db, {
    provider: 'github',
    providerUserId: String(ghUser.id),
    email,
    displayName: ghUser.name || ghUser.login,
    avatarUrl: ghUser.avatar_url,
  });

  return createOAuthSession(user, env.JWT_SECRET);
}
