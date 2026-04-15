import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/admin/users', icon: '👥', label: 'Users' },
  { path: '/admin/listings', icon: '📦', label: 'Listings' },
  { path: '/admin/admins', icon: '🛡️', label: 'Admin Accounts' },
];

const S = {
  sidebar: {
    width: 220, flexShrink: 0, background: '#0F172A', minHeight: '100vh',
    display: 'flex', flexDirection: 'column', borderRight: '1px solid #1E293B'
  },
  logo: { padding: '24px 20px', borderBottom: '1px solid #1E293B' },
  nav: { padding: '12px 12px', flex: 1 },
  navLink: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
    borderRadius: 10, textDecoration: 'none', fontWeight: 600, fontSize: 14,
    color: active ? 'white' : '#64748B',
    background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
    borderLeft: active ? '3px solid #6366F1' : '3px solid transparent',
    marginBottom: 4, transition: 'all 0.15s'
  }),
  main: { flex: 1, background: '#0F172A', minHeight: '100vh', overflow: 'auto' },
  topbar: { background: '#1E293B', borderBottom: '1px solid #334155', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  content: { padding: 28 }
};

export default function AdminLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.logo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🛡️</div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>CampusMarket</div>
              <div style={{ color: '#64748B', fontSize: 11, fontWeight: 500 }}>Admin Panel</div>
            </div>
          </div>
        </div>

        <nav style={S.nav}>
          {NAV.map(item => (
            <Link key={item.path} to={item.path} style={S.navLink(location.pathname === item.path)}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #1E293B' }}>
          <div style={{ padding: '10px 14px', background: '#1E293B', borderRadius: 10, marginBottom: 8 }}>
            <p style={{ color: '#94A3B8', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{admin.name}</p>
            <p style={{ color: '#475569', fontSize: 11 }}>{admin.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '9px 14px', background: 'transparent', border: '1px solid #334155', borderRadius: 10, color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={S.main}>
        <div style={S.topbar}>
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>{title}</h1>
          <Link to="/" target="_blank" style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>
            ↗ View Site
          </Link>
        </div>
        <div style={S.content}>{children}</div>
      </div>
    </div>
  );
}
