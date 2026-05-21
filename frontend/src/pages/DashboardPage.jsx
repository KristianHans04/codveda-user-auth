import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const initial = (user?.display_name || user?.email || '?')[0].toUpperCase();
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';
  const daysSinceJoined = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="dashboard-page">
      <header className="dash-header">
        <div className="container">
          <h1>Dashboard</h1>
          <div className="dash-user">
            <span className="dash-greeting">Welcome, {user?.display_name || 'User'}</span>
            <button className="logout-btn" onClick={logout}>Sign Out</button>
          </div>
        </div>
      </header>

      <main className="dash-main container">
        {/* Profile Card */}
        <section className="dash-card">
          <div className="profile-avatar">{initial}</div>
          <h2>Profile</h2>
          <dl className="dash-details">
            <dt>Display Name</dt>
            <dd>{user?.display_name || '-'}</dd>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
            <dt>Account Created</dt>
            <dd>{joinedDate}</dd>
            <dt>User ID</dt>
            <dd className="mono">{user?.id}</dd>
          </dl>
        </section>

        {/* Quick Stats */}
        <section className="dash-card">
          <h2>Quick Stats</h2>
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="stat-val">{daysSinceJoined}</div>
              <div className="stat-label">Days Active</div>
            </div>
            <div className="dash-stat">
              <div className="stat-val">1</div>
              <div className="stat-label">Sessions</div>
            </div>
            <div className="dash-stat">
              <div className="stat-val">{user?.login_method === 'oauth' ? 'OAuth' : 'Email'}</div>
              <div className="stat-label">Auth Method</div>
            </div>
            <div className="dash-stat">
              <div className="stat-val">Active</div>
              <div className="stat-label">Status</div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="dash-card">
          <h2>Security Status</h2>
          <ul className="security-list">
            <li>
              <span className="indicator success"></span>
              Password hashed with PBKDF2-SHA256 (100,000 iterations)
            </li>
            <li>
              <span className="indicator success"></span>
              Session secured via HTTP-only cookie with JWT
            </li>
            <li>
              <span className="indicator success"></span>
              Login rate limiting active (5 attempts per 15 minutes)
            </li>
            <li>
              <span className="indicator success"></span>
              CSRF protection via SameSite cookie attribute
            </li>
          </ul>
        </section>

        {/* Protected Content */}
        <section className="dash-card">
          <h2>Protected Content</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            This page is only accessible to authenticated users. Unauthenticated requests
            are redirected to the login page. The JWT is verified on every request to <code style={{ background: 'var(--color-surface)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.8rem' }}>/api/auth/me</code>.
          </p>
        </section>
      </main>

      <footer className="dash-footer">
        <p>Codveda Web Development Internship - Level 3: User Authentication</p>
      </footer>
    </div>
  );
}
