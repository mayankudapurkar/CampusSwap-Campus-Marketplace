import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
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
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Check Your Inbox!</h2>
            <p style={{ color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6 }}>We sent a password reset link to <strong>{email}</strong>.</p>
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
}
