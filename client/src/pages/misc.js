// VerifyEmail.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get(`/api/auth/verify-email/${token}`)
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch(err => { setStatus('error'); setMessage(err?.response?.data?.message || 'Verification failed'); });
  }, [token]);

  const icon = status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌';
  const color = status === 'loading' ? 'var(--text3)' : status === 'success' ? 'var(--success)' : 'var(--error)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 48, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>{icon}</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>
          {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Email Verified!' : 'Verification Failed'}
        </h2>
        <p style={{ color: 'var(--text3)', marginBottom: 28, lineHeight: 1.6 }}>{message}</p>
        {status !== 'loading' && (
          <Link to={status === 'success' ? '/' : '/login'} className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '13px', fontSize: 15 }}>
            {status === 'success' ? 'Go to Homepage 🎉' : 'Back to Login'}
          </Link>
        )}
      </div>
    </div>
  );
};

// ForgotPassword.js
export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A1035 0%, #2D1B69 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 40, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, color: 'var(--text)' }}>Check Your Inbox!</h2>
            <p style={{ color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6 }}>We sent a password reset link to <strong>{email}</strong>. Check your inbox (and spam folder).</p>
            <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '13px' }}>Back to Login</Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>Reset Password 🔑</h2>
            <p style={{ color: 'var(--text3)', marginBottom: 24, fontSize: 14 }}>Enter your college email and we'll send a reset link.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">College Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@college.edu" required />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', padding: '13px', fontSize: 15 }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/login" style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>← Back to Login</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ResetPassword.js
export const ResetPassword = () => {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { alert('Passwords do not match'); return; }
    setLoading(true);
    try {
      await axios.post(`/api/auth/reset-password/${token}`, { password: form.password });
      setSuccess(true);
    } catch (err) {
      alert(err?.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A1035 0%, #2D1B69 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 40, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>Password Reset!</h2>
            <p style={{ color: 'var(--text3)', marginBottom: 24 }}>Your password has been updated. You can now log in.</p>
            <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '13px' }}>Go to Login</Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, color: 'var(--text)' }}>Set New Password 🔒</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-group">
                <label className="input-label">New Password</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input" placeholder="Min. 6 characters" required minLength={6} />
              </div>
              <div className="input-group">
                <label className="input-label">Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} className="input" placeholder="Repeat password" required />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ justifyContent: 'center', padding: '13px', fontSize: 15 }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// NotFound.js
export const NotFound = () => (
  <div style={{ minHeight: '100vh', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 20 }}>
    <div style={{ fontSize: 96, marginBottom: 20 }}>🔍</div>
    <h1 style={{ fontSize: 48, fontWeight: 800, color: 'var(--text)', marginBottom: 12, letterSpacing: '-2px' }}>404</h1>
    <p style={{ fontSize: 18, color: 'var(--text3)', marginBottom: 28 }}>Oops! This page doesn't exist</p>
    <Link to="/" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>← Go Home</Link>
  </div>
);
