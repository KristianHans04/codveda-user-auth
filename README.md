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

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | Public | Create account, returns JWT cookie |
| POST | `/api/auth/login` | Public | Authenticate, returns JWT cookie |
| POST | `/api/auth/logout` | Any | Clears auth cookie |
| GET | `/api/auth/me` | Required | Returns authenticated user profile |

## Local Development

```bash
cd frontend
npm install

# Create a local D1 database
npx wrangler d1 create codveda-auth-db
# Update database_id in wrangler.toml with the returned ID

# Apply the schema
npx wrangler d1 execute codveda-auth-db --local --file=../database/schema.sql

# Set the JWT secret for local development
echo 'JWT_SECRET=your-strong-secret-here-min-32-chars' > .dev.vars

# Start local dev server (Vite + Pages Functions + D1)
npx wrangler pages dev dist -- npm run dev
```

## Deployment to Cloudflare

```bash
# 1. Create the D1 database (if not created)
npx wrangler d1 create codveda-auth-db
# Copy the database_id into wrangler.toml

# 2. Apply schema to production D1
npx wrangler d1 execute codveda-auth-db --file=../database/schema.sql

# 3. Set the JWT secret in production
npx wrangler secret put JWT_SECRET
# Enter a strong, random 32+ character secret

# 4. Build and deploy to Cloudflare Pages
npm run build
npx wrangler pages deploy dist --project-name=codveda-user-auth

# The app will be available at:
# https://codveda-user-auth.pages.dev
```

## Database Schema

**users** table:
- `id` TEXT PRIMARY KEY (UUID via crypto.randomUUID)
- `email` TEXT UNIQUE (normalized: lowercase, trimmed)
- `password_hash` TEXT (format: `iterations:salt_hex:hash_hex`)
- `display_name` TEXT
- `created_at` / `updated_at` DATETIME

**auth_attempts** table:
- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `email` TEXT, `ip_address` TEXT
- `attempted_at` DATETIME
- `success` INTEGER (0 = failed, 1 = success)
- Indexes on (email, attempted_at) and (ip_address, attempted_at)
