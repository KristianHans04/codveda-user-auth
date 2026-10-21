import { getStateCookie, upsertOAuthUser, createOAuthSession, oauthErrorRedirect } from '../_oauth_helpers.js';

async function handleGoogleCallback(context) {
  const { env, request } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const storedState = getStateCookie(request);

  if (!code || !state || state !== storedState) {
    return oauthErrorRedirect('Invalid OAuth state. Please try again.');
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.APP_URL}/api/auth/oauth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return oauthErrorRedirect('Google authentication failed. Please try again.');
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const gUser = await userRes.json();

  const user = await upsertOAuthUser(db, {
    provider: 'google',
    providerUserId: gUser.sub,
    email: gUser.email,
    displayName: gUser.name,
    avatarUrl: gUser.picture,
  });

  return createOAuthSession(user, env.JWT_SECRET);
}

export const onRequestGet = async (context) => {
  try {
    return await handleGoogleCallback(context);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[CODVEDA-AUTH] GET /auth/oauth/google/callback error:", message, stack);
    return oauthErrorRedirect('Authentication failed. Please try again.');
  }
};
