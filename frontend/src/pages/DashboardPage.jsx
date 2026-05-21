import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();

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
        <section className="dash-card">
          <h2>Account Details</h2>
          <dl className="dash-details">
            <dt>Display Name</dt>
            <dd>{user?.display_name}</dd>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
            <dt>Account Created</dt>
            <dd>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</dd>
            <dt>User ID</dt>
            <dd className="mono">{user?.id}</dd>
          </dl>
        </section>
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
          </ul>
        </section>
        <section className="dash-card">
          <h2>Protected Content</h2>
          <p>This page is only accessible to authenticated users. Unauthenticated requests are redirected to the login page. The JWT is verified on every request to <code>/api/auth/me</code>.</p>
        </section>
      </main>
      <footer className="dash-footer">
        <p>Codveda Web Development Internship - Level 3: User Authentication</p>
      </footer>
    </div>
  );
}
