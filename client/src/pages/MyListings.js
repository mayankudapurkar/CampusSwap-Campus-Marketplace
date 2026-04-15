import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/layout/Navbar';
import ListingCard from '../components/listings/ListingCard';
import toast from 'react-hot-toast';

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    let isMounted = true;

    const fetchListings = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/listings/user/me?status=${activeTab}`);
        if (isMounted) setListings(data.listings || []);
      } catch (error) {
        console.error('Failed to fetch my listings:', error);
        if (isMounted) {
          setListings([]);
          toast.error(error.response?.data?.message || 'Failed to load your listings');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchListings();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return;

    try {
      await axios.delete(`/api/listings/${id}`);
      setListings((prev) => prev.filter((listing) => listing._id !== id));
      toast.success('Listing deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const tabs = ['active', 'sold', 'reserved', 'all'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />
      <div className="container" style={{ padding: '32px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>My Listings</h1>
          <Link to="/create-listing" className="btn btn-primary">+ New Listing</Link>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'white', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', width: 'fit-content' }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', transition: 'var(--transition)', background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--text2)' }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 300, background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div className="skeleton" style={{ height: '100%' }} />
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>Listings</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No {activeTab} listings</h3>
            <p style={{ color: 'var(--text3)', marginBottom: 24 }}>
              {activeTab === 'active' ? 'Start by creating your first listing!' : 'No listings in this category'}
            </p>
            {activeTab === 'active' && <Link to="/create-listing" className="btn btn-primary">Create Listing</Link>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {listings.map((listing, i) => (
              <div key={listing._id} style={{ position: 'relative', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                <ListingCard listing={listing} />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <Link to={`/edit-listing/${listing._id}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: 13 }}>
                    Edit
                  </Link>
                  <button onClick={() => handleDelete(listing._id)} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: 13 }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyListings;
