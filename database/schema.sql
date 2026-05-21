-- =============================================================
-- Codveda Level 3 — User Authentication System
-- Cloudflare D1 (SQLite) Schema
-- =============================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Rate limiting for login attempts (D1-backed, since Workers are stateless)
CREATE TABLE IF NOT EXISTS auth_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  success INTEGER DEFAULT 0
);

CREATE INDEX idx_auth_attempts_email_time ON auth_attempts(email, attempted_at);
CREATE INDEX idx_auth_attempts_ip_time ON auth_attempts(ip_address, attempted_at);
