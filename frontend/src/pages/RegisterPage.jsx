import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import OAuthButtons from '../components/OAuthButtons';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      await register(email, password, displayName);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Join in seconds with OAuth or email.</p>

        <OAuthButtons action="sign up" />

        <div className="auth-divider"><span>or register with email</span></div>

        {error && <div className="auth-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <label htmlFor="reg-name">Display Name</label>
          <input id="reg-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name" required maxLength={100} autoComplete="name" />
          <label htmlFor="reg-email">Email</label>
          <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" required autoComplete="email" />
          <label htmlFor="reg-password">Password</label>
          <input id="reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters" required autoComplete="new-password" />
          <label htmlFor="reg-confirm">Confirm Password</label>
          <input id="reg-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password" required autoComplete="new-password" />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
