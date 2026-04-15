import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/layout/Navbar';
import ListingCard from '../components/listings/ListingCard';
import { useAuth } from '../context/AuthContext';

const categories = [
  { id: 'textbooks', label: 'Textbooks', emoji: '📚' },
  { id: 'notes', label: 'Notes', emoji: '📝' },
  { id: 'electronics', label: 'Electronics', emoji: '💻' },
  { id: 'lab-equipment', label: 'Lab Gear', emoji: '🔬' },
  { id: 'stationery', label: 'Stationery', emoji: '✏️' },
  { id: 'calculators', label: 'Calculators', emoji: '🔢' },
  { id: 'cycles', label: 'Cycles', emoji: '🚲' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
];

const stats = [
  { label: 'Active Listings', value: '2,400+', icon: '📦' },
  { label: 'Students Joined', value: '8,000+', icon: '🎓' },
  { label: 'Successful Trades', value: '15,000+', icon: '🤝' },
  { label: 'Money Saved', value: '₹50L+', icon: '💰' },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    try {
      const { data } = await axios.get('/api/listings?limit=8&sort=-createdAt');
      setRecentListings(data.listings);
    } catch {
      setRecentListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/listings?search=${encodeURIComponent(searchQuery)}`);
    else navigate('/listings');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1A1035 0%, #2D1B69 50%, #1A1035 100%)',
        position: 'relative', overflow: 'hidden', padding: '80px 0 100px'
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: `${80 + i * 60}px`, height: `${80 + i * 60}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(91,74,232,${0.15 - i * 0.02}) 0%, transparent 70%)`,
              top: `${10 + i * 12}%`, left: `${5 + i * 15}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '6px 16px', marginBottom: 24, backdropFilter: 'blur(10px)' }}>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>🎓 For students, by students</span>
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, color: 'white', marginBottom: 20, lineHeight: 1.1, letterSpacing: '-2px' }}>
            Your Campus's<br />
            <span style={{ background: 'linear-gradient(135deg, #A78BFA, #FB7185)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Marketplace
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2.5vw, 20px)', color: 'rgba(255,255,255,0.75)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Buy, sell, or exchange textbooks, notes, electronics, and everything else you need for college life.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ maxWidth: 560, margin: '0 auto 40px', display: 'flex', gap: 0, background: 'white', borderRadius: 'var(--radius-xl)', padding: '6px 6px 6px 20px', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 18, marginRight: 10 }}>🔍</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search textbooks, calculators, notes..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontFamily: 'inherit', color: 'var(--text)', background: 'transparent' }} />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-lg)', padding: '12px 24px', flexShrink: 0 }}>
              Search
            </button>
          </form>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/listings" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 28px', fontSize: 15, backdropFilter: 'blur(10px)' }}>
              Browse Listings 🏪
            </Link>
            {!user && (
              <Link to="/register" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
                Join Free 🚀
              </Link>
            )}
            {user && (
              <Link to="/create-listing" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
                Sell Something ✨
              </Link>
            )}
          </div>
        </div>

        {/* Wave */}
        <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}>
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 30C1200 60 900 0 720 30C540 60 240 0 0 30L0 60Z" fill="var(--surface2)" />
          </svg>
        </div>

        <style>{`@keyframes float { from { transform: translateY(0px) scale(1); } to { transform: translateY(-20px) scale(1.05); } }`}</style>
      </section>

      {/* Stats */}
     {/* <section style={{ padding: '0 0 60px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginTop: '-30px', position: 'relative', zIndex: 2 }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '20px 24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', textAlign: 'center', animation: `fadeIn 0.5s ease ${i * 0.1}s both` }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px' }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Categories */}
      <section style={{ padding: '0 0 60px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Browse by Category</h2>
            <Link to="/listings" style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
            {categories.map((cat, i) => (
              <Link key={cat.id} to={`/listings?category=${cat.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'white', borderRadius: 'var(--radius-lg)', padding: '20px 12px', textAlign: 'center',
                  border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s ease',
                  animation: `fadeIn 0.4s ease ${i * 0.05}s both`
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.querySelector('.cat-label').style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.querySelector('.cat-label').style.color = 'var(--text2)'; }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{cat.emoji}</div>
                  <span className="cat-label" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', transition: 'color 0.2s' }}>{cat.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section style={{ padding: '0 0 80px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Fresh Listings 🔥</h2>
            <Link to="/listings" style={{ fontSize: 14, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>See all →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ height: 180 }} />
                  <div style={{ padding: 16 }}>
                    <div className="skeleton" style={{ height: 16, borderRadius: 4, marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 16, borderRadius: 4, width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {recentListings.map((listing, i) => (
                <div key={listing._id} style={{ animation: `fadeIn 0.4s ease ${i * 0.05}s both` }}>
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', padding: '80px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: 'white', marginBottom: 12, letterSpacing: '-1px' }}>How It Works</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 52, fontSize: 16 }}>Three simple steps to start trading</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
            {[
              { step: '01', icon: '✉️', title: 'Sign Up', desc: 'Register with your college email to verify you\'re a student' },
              { step: '02', icon: '📸', title: 'List an Item', desc: 'Post what you want to sell or exchange with photos & details' },
              { step: '03', icon: '💬', title: 'Chat & Trade', desc: 'Connect with buyers through our in-app chat and complete the deal' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-xl)', padding: 32, border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginBottom: 8 }}>{item.step}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          {!user && (
            <Link to="/register" className="btn" style={{ marginTop: 48, background: 'white', color: 'var(--primary)', padding: '14px 36px', fontSize: 16, fontWeight: 700, display: 'inline-flex' }}>
              Get Started Free 🚀
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#1A1035', padding: '40px 0 24px', color: 'rgba(255,255,255,0.6)' }}>
        <div className="container">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 32, marginBottom: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🎓</div>
                <span style={{ fontWeight: 800, fontSize: 16, color: 'white' }}>CampusSwap</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 220 }}>The student marketplace for buying, selling, and exchanging college essentials.</p>
            </div>
            {[
              { heading: 'Marketplace', links: ['Browse All', 'Textbooks', 'Electronics', 'Notes'] },
              { heading: 'Account', links: ['Sign Up', 'Login', 'My Profile', 'My Listings'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 12, fontSize: 14 }}>{col.heading}</h4>
                {col.links.map(link => <p key={link} style={{ fontSize: 13, marginBottom: 6, cursor: 'pointer' }}>{link}</p>)}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20, textAlign: 'center', fontSize: 12 }}>
            <p>© 2026 CampusSwap. Made with ❤️ for students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
