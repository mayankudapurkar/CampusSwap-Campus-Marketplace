import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 20 }}>
      <div style={{ fontSize: 100, marginBottom: 20, animation: 'fadeIn 0.5s ease' }}>🔍</div>
      <h1 style={{ fontSize: 56, fontWeight: 800, color: 'var(--text)', marginBottom: 12, letterSpacing: '-3px', animation: 'fadeIn 0.5s ease 0.1s both' }}>404</h1>
      <p style={{ fontSize: 20, color: 'var(--text3)', marginBottom: 8, animation: 'fadeIn 0.5s ease 0.2s both' }}>Page Not Found</p>
      <p style={{ fontSize: 15, color: 'var(--text3)', marginBottom: 32, maxWidth: 360, lineHeight: 1.6, animation: 'fadeIn 0.5s ease 0.3s both' }}>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15, animation: 'fadeIn 0.5s ease 0.4s both' }}>← Go Home</Link>
    </div>
  );
}
