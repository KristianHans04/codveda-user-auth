import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import OAuthButtons from '../components/OAuthButtons';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(oauthError || '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-decor">
        <div className="decor-content">
          <div className="decor-shield">
            <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
          </div>
          <h2>Secure Access</h2>
          <p>Your data is protected with industry-standard encryption and HTTP-only JWT cookies.</p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <h1>Sign In</h1>
          <p className="auth-subtitle">Access your secure dashboard.</p>

          <OAuthButtons action="sign in" />
          <div className="auth-divider"><span>or continue with email</span></div>

          {error && <div className="auth-error" role="alert">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            <label htmlFor="login-password">Password</label>
            <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required autoComplete="current-password" />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="auth-switch">No account? <Link to="/register">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}
