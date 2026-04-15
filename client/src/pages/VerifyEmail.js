import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get(`/api/auth/verify-email/${token}`)
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch(err => { setStatus('error'); setMessage(err?.response?.data?.message || 'Verification failed'); });
  }, [token]);

  const icon = status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 48, maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>{icon}</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>
          {status === 'loading' ? 'Verifying your email...' : status === 'success' ? 'Email Verified! 🎉' : 'Verification Failed'}
        </h2>
        <p style={{ color: 'var(--text3)', marginBottom: 28, lineHeight: 1.6 }}>{message}</p>
        {status !== 'loading' && (
          <Link to={status === 'success' ? '/' : '/login'} className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', padding: '13px', fontSize: 15 }}>
            {status === 'success' ? 'Go to Homepage' : 'Back to Login'}
          </Link>
        )}
      </div>
    </div>
  );
}
