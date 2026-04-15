import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('/api/notifications');
      setNotifications(data);
      setUnreadNotifs(data.filter(n => !n.isRead).length);
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const markAllRead = async () => {
    await axios.patch('/api/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadNotifs(0);
  };

  const getAvatar = (u) => {
    if (u?.avatar) return <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />;
    return u?.name?.[0]?.toUpperCase() || '?';
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav style={{
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 20px rgba(91,74,232,0.06)'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64, gap: 16 }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18
          }}>🎓</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Campus<span style={{ color: 'var(--primary)' }}>Swap</span>
          </span>
        </Link>

        {/* Search bar - desktop */}
        <div style={{ flex: 1, maxWidth: 400, display: 'flex', margin: '0 auto' }} className="desktop-search">
          <SearchBar />
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="nav-links">
          <NavLink to="/listings" active={isActive('/listings')} icon="🏪">Browse</NavLink>
          {user && <NavLink to="/saved" active={isActive('/saved')} icon="🔖">Saved</NavLink>}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          {user ? (
            <>
              {/* Sell button */}
              <Link to="/create-listing" className="btn btn-primary" style={{ padding: '8px 16px', gap: 6 }}>
                <PlusIcon /> <span className="hide-mobile">Sell</span>
              </Link>

              {/* Chat */}
              <Link to="/chat" style={{ position: 'relative', padding: '8px', display: 'flex', color: 'var(--text2)', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)', background: isActive('/chat') ? 'var(--surface3)' : 'transparent', textDecoration: 'none' }}>
                <ChatIcon />
                {unreadCount > 0 && <span className="badge" style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, fontSize: 10 }}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </Link>

              {/* Notifications */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button onClick={() => { setNotifOpen(!notifOpen); fetchNotifications(); }}
                  style={{ position: 'relative', padding: '8px', display: 'flex', color: 'var(--text2)', borderRadius: 'var(--radius-sm)', background: notifOpen ? 'var(--surface3)' : 'transparent', border: 'none', cursor: 'pointer' }}>
                  <BellIcon />
                  {unreadNotifs > 0 && <span className="badge" style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, fontSize: 10 }}>{unreadNotifs}</span>}
                </button>
                {notifOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320, background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 100 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Notifications</span>
                      {unreadNotifs > 0 && <button onClick={markAllRead} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>}
                    </div>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)' }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                          <p style={{ fontSize: 14 }}>No notifications yet</p>
                        </div>
                      ) : notifications.map(n => (
                        <div key={n._id} onClick={() => { if (n.link) navigate(n.link); setNotifOpen(false); }}
                          style={{ padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'flex-start', background: n.isRead ? 'white' : 'var(--surface2)', cursor: n.link ? 'pointer' : 'default', borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }}>
                          {n.sender?.avatar ? <img src={n.sender.avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> :
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{n.sender?.name?.[0] || '?'}</div>}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{n.title}</p>
                            <p style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>
                          </div>
                          {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--border)', background: 'var(--surface3)', cursor: 'pointer', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: 15, flexShrink: 0 }}>
                  {getAvatar(user)}
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 100 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{user.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                      {!user.isVerified && <span style={{ fontSize: 11, color: 'var(--warning)', background: '#FFF8E1', padding: '2px 8px', borderRadius: 100, fontWeight: 600, marginTop: 4, display: 'inline-block' }}>⚠️ Unverified</span>}
                    </div>
                    {[
                      { to: `/profile/${user._id}`, icon: '👤', label: 'My Profile' },
                      { to: '/my-listings', icon: '📦', label: 'My Listings' },
                      { to: '/saved', icon: '🔖', label: 'Saved Items' },
                      { to: '/create-listing', icon: '➕', label: 'New Listing' },
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', color: 'var(--text)', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'var(--transition)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span>{item.icon}</span>{item.label}
                      </Link>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border)', padding: '4px 0' }}>
                      <button onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, width: '100%', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFF0F0'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px' }}>Log in</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>Sign up</Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text2)' }}>
            <MenuIcon />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .desktop-search { display: none !important; }
          .hide-mobile { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ to, active, icon, children }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
      borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: 14,
      color: active ? 'var(--primary)' : 'var(--text2)',
      background: active ? 'var(--surface3)' : 'transparent',
      transition: 'var(--transition)'
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface2)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
      {icon} {children}
    </Link>
  );
}

function SearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/listings?search=${encodeURIComponent(query.trim())}`);
  };
  return (
    <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', position: 'relative' }}>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search textbooks, notes, gadgets..."
        style={{ width: '100%', padding: '9px 16px 9px 40px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', fontSize: 14, fontFamily: 'inherit', background: 'var(--surface2)', outline: 'none', color: 'var(--text)', transition: 'var(--transition)' }}
        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(91,74,232,0.1)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface2)'; e.target.style.boxShadow = 'none'; }} />
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>🔍</span>
    </form>
  );
}
