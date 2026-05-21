# Level-3-User-Auth

A secure user authentication system with a protected dashboard, built entirely on the Cloudflare ecosystem. Features PBKDF2 password hashing, JWT sessions via HTTP-only cookies, D1-backed rate limiting, and React Router protected routes.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Vite 6 |
| API | Cloudflare Pages Functions |
| Database | Cloudflare D1 (serverless SQLite) |
| Crypto | WebCrypto API (PBKDF2-SHA256, HMAC-SHA256) |
| Hosting | Cloudflare Pages |

## Features

- User registration with email normalization and duplicate detection
- PBKDF2-SHA256 password hashing (100,000 iterations, 16-byte salt)
- JWT authentication signed with HMAC-SHA256 via WebCrypto
- HTTP-only, Secure, SameSite=Lax cookies (no client-side token storage)
- D1-backed login rate limiting (5 failed attempts per 15-minute window)
- Protected React Router routes with session verification on mount
- Responsive login, register, and dashboard pages with Codveda branding
- Parameterized D1 queries throughout (SQL injection prevention)

## Security Architecture

```
Registration flow:
  Client -> POST /api/auth/register -> validate input -> normalize email
  -> check duplicate -> PBKDF2 hash password -> INSERT user -> sign JWT
  -> set HTTP-only cookie -> return user

Login flow:
  Client -> POST /api/auth/login -> normalize email -> check rate limit
  -> SELECT user -> PBKDF2 verify password -> record attempt
  -> sign JWT -> set HTTP-only cookie -> return user

Protected route:
  Client -> GET /api/auth/me -> parse cookie -> verify JWT signature
  -> check expiry -> SELECT user from D1 -> return user or 401
```

## Project Structure

```
Level-3-User-Auth/
  database/
    schema.sql                # D1 tables (users + auth_attempts)
  frontend/
    functions/api/auth/       # Pages Functions (auth API)
      _helpers.js             # PBKDF2, JWT, rate limiting, cookies
      register.js             # POST /api/auth/register
      login.js                # POST /api/auth/login
      logout.js               # POST /api/auth/logout
      me.js                   # GET /api/auth/me
    src/
      api.js                  # Fetch-based auth API client
      hooks/
        useAuth.jsx           # AuthProvider context + useAuth hook
      components/
        ProtectedRoute.jsx    # Route guard (redirects if no session)
      pages/
        LoginPage.jsx         # Login form
        RegisterPage.jsx      # Registration form with confirm password
        DashboardPage.jsx     # Protected user dashboard
      App.jsx                 # React Router setup
      App.css                 # Mobile-first responsive styles
      main.jsx                # React entry point
    index.html
    package.json
    vite.config.js
    wrangler.toml             # D1 binding + Pages Functions config
```

## Live Deployment

| Environment | URL |
|---|---|
| Cloudflare Pages | https://codveda-auth.pages.dev |
| Custom Domain | https://auth.kristianhans.com |

Deployed via **GitHub auto-deploy**: every push to `main` triggers a new Cloudflare Pages build automatically.

## OAuth Providers

In addition to email/password, users can sign in with:

| Provider | Setup Required |
|----------|---------------|
| GitHub | Create OAuth App at https://github.com/settings/developers |
| Google | Create OAuth Client at https://console.cloud.google.com/apis/credentials |

**Callback URLs to configure in your OAuth apps:**
- GitHub: `https://auth.kristianhans.com/api/auth/oauth/github/callback`
- Google: `https://auth.kristianhans.com/api/auth/oauth/google/callback`

**Secrets to set after creating OAuth apps:**
```bash
echo "$GITHUB_CLIENT_ID"     | npx wrangler pages secret put GITHUB_CLIENT_ID     --project-name codveda-auth
echo "$GITHUB_CLIENT_SECRET" | npx wrangler pages secret put GITHUB_CLIENT_SECRET  --project-name codveda-auth
echo "$GOOGLE_CLIENT_ID"     | npx wrangler pages secret put GOOGLE_CLIENT_ID      --project-name codveda-auth
echo "$GOOGLE_CLIENT_SECRET" | npx wrangler pages secret put GOOGLE_CLIENT_SECRET  --project-name codveda-auth
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Create account, returns JWT cookie |
| POST | `/api/auth/login` | Public | Authenticate, returns JWT cookie |
| POST | `/api/auth/logout` | Any | Clears auth cookie |
| GET | `/api/auth/me` | Required | Returns authenticated user profile |
| GET | `/api/auth/oauth/github` | Public | Initiate GitHub OAuth flow |
| GET | `/api/auth/oauth/github/callback` | Public | GitHub OAuth callback |
| GET | `/api/auth/oauth/google` | Public | Initiate Google OAuth flow |
| GET | `/api/auth/oauth/google/callback` | Public | Google OAuth callback |

## Local Development

```bash
cd frontend
npm install

# For local dev, apply schema to a local D1 instance:
npx wrangler d1 execute codveda-db --local --file=../database/schema.sql

# Set secrets for local development:
cat > .dev.vars << 'EOF'
JWT_SECRET=your-strong-secret-here-min-32-chars
APP_URL=http://localhost:5173
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF

# Start local dev server (Vite + Pages Functions + D1)
npx wrangler pages dev dist -- npm run dev
```

## Deployment to Cloudflare

This project is deployed to Cloudflare Pages with GitHub integration.
The D1 database (`codveda-db`, shared with Level-3-Fullstack-CRUD) is already bound
under the `DB` environment variable. `JWT_SECRET` and `APP_URL` are already set.

```bash
# The shared D1 database (codveda-db) was created once for all Level-3 projects:
# npx wrangler d1 create codveda-db
# DB ID: 3861c2d8-7327-4032-81f6-36e91bb0ddad

# Apply/re-apply the merged schema to production D1 (run from repo root):
npx wrangler d1 execute codveda-db --remote --file=./database/schema.sql

# Secrets already set in production (re-set if rotating):
echo "$JWT_SECRET" | npx wrangler pages secret put JWT_SECRET --project-name codveda-auth
echo "https://auth.kristianhans.com" | npx wrangler pages secret put APP_URL --project-name codveda-auth

# Build and deploy manually (normally handled by GitHub auto-deploy):
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=codveda-auth

# The app is live at:
# https://codveda-auth.pages.dev
# https://auth.kristianhans.com
```

## Database Schema

The shared `codveda-db` D1 database (DB ID: `3861c2d8-7327-4032-81f6-36e91bb0ddad`) is used across all Level-3 projects. Full schema at `../database/schema.sql`.

**users** table:
- `id` TEXT PRIMARY KEY (UUID via crypto.randomUUID)
- `email` TEXT UNIQUE (normalized: lowercase, trimmed)
- `password_hash` TEXT (format: `iterations:salt_hex:hash_hex` — null for OAuth-only accounts)
- `display_name` TEXT
- `created_at` / `updated_at` DATETIME

**oauth_accounts** table:
- `id` TEXT PRIMARY KEY
- `user_id` TEXT REFERENCES users(id) ON DELETE CASCADE
- `provider` TEXT (github | google)
- `provider_user_id` TEXT
- UNIQUE constraint on (provider, provider_user_id)
- Links OAuth identities to a single user account

**auth_attempts** table:
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `email` TEXT, `ip_address` TEXT
- `attempted_at` DATETIME
- `success` INTEGER (0 = failed, 1 = success)
- Indexes on (email, attempted_at) and (ip_address, attempted_at) for rate-limit queries
