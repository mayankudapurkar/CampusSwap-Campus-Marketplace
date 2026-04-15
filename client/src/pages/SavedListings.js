import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/layout/Navbar';
import ListingCard from '../components/listings/ListingCard';

function SavedListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users/me/saved')
      .then(({ data }) => setListings(data))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveToggle = (id, saved) => {
    if (!saved) setListings(prev => prev.filter(l => l._id !== id));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />
      <div className="container" style={{ padding: '32px 20px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 24 }}>Saved Listings 🔖</h1>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔖</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No saved items yet</h3>
            <p style={{ color: 'var(--text3)', marginBottom: 24 }}>Browse listings and tap ❤️ to save items you're interested in</p>
            <Link to="/listings" className="btn btn-primary">Browse Listings</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {listings.map((listing, i) => (
              <div key={listing._id} style={{ animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                <ListingCard listing={listing} onSaveToggle={handleSaveToggle} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default SavedListings;