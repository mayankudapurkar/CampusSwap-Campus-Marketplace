import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const conditionColors = { new: '#6BCB77', 'like-new': '#4CAF50', good: '#FFB74D', fair: '#FF9800', poor: '#EF5350' };
const typeInfo = {
  sell: { bg: '#E8F5E9', color: '#2E7D32', label: 'For Sale' },
  exchange: { bg: '#E3F2FD', color: '#1565C0', label: 'Exchange' },
  free: { bg: '#FFF3E0', color: '#E65100', label: 'Free' }
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data } = await axios.get(`/api/listings/${id}`);
      setListing(data);
      setSaved(data.savedBy?.includes(user?._id));
    } catch {
      toast.error('Listing not found');
      navigate('/listings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) { navigate('/login'); return; }
    setSaving(true);
    try {
      const { data } = await axios.post(`/api/listings/${id}/save`);
      setSaved(data.saved);
      setListing(prev => ({ ...prev, savedBy: data.saved ? [...(prev.savedBy || []), user._id] : (prev.savedBy || []).filter(u => u !== user._id) }));
      toast.success(data.saved ? 'Saved to your list!' : 'Removed from saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleContact = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const { data } = await axios.post('/api/chat/conversations', { recipientId: listing.seller._id, listingId: listing._id });
      navigate(`/chat/${data._id}`);
    } catch { toast.error('Failed to start chat'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/listings/${id}`);
      toast.success('Listing deleted');
      navigate('/my-listings');
    } catch { toast.error('Failed to delete'); setDeleting(false); }
  };

  const handleStatusChange = async (status) => {
    setStatusLoading(true);
    try {
      await axios.patch(`/api/listings/${id}/status`, { status });
      setListing(prev => ({ ...prev, status }));
      toast.success(`Marked as ${status}`);
    } catch { toast.error('Failed to update'); }
    finally { setStatusLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div className="skeleton" style={{ height: 460, borderRadius: 'var(--radius-xl)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[200, 100, 150, 80, 80].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 'var(--radius-md)' }} />)}
          </div>
        </div>
      </div>
    </div>
  );

  if (!listing) return null;
  const isOwner = user?._id === listing.seller?._id;
  const type = typeInfo[listing.type] || typeInfo.sell;
  const hasImages = listing.images?.length > 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />
      <div className="container" style={{ padding: '28px 20px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: 'var(--text3)' }}>
          <Link to="/" style={{ color: 'var(--text3)', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link to="/listings" style={{ color: 'var(--text3)', textDecoration: 'none' }}>Listings</Link>
          <span>›</span>
          <span style={{ color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{listing.title}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: 28, alignItems: 'flex-start' }}>
          {/* Images */}
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--surface3)', marginBottom: 12 }}>
              {listing.status !== 'active' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ background: 'white', padding: '8px 24px', borderRadius: 100, fontWeight: 700, fontSize: 18 }}>
                    {listing.status === 'sold' ? '✅ Sold' : listing.status === 'reserved' ? '🔒 Reserved' : listing.status}
                  </span>
                </div>
              )}
              {hasImages ? (
                <img src={listing.images[activeImg]?.url} alt={listing.title}
                  style={{ width: '100%', height: 420, objectFit: 'contain', background: '#f8f8ff' }} />
              ) : (
                <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
                  {getCategoryEmoji(listing.category)}
                </div>
              )}
            </div>
            {hasImages && listing.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {listing.images.map((img, i) => (
                  <div key={i} onClick={() => setActiveImg(i)}
                    style={{ width: 72, height: 72, flexShrink: 0, borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer', border: `2.5px solid ${activeImg === i ? 'var(--primary)' : 'var(--border)'}`, transition: 'var(--transition)' }}>
                    <img src={img.url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ animation: 'fadeIn 0.4s ease 0.1s both' }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ background: type.bg, color: type.color, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>{type.label}</span>
              <span style={{ background: conditionColors[listing.condition] + '25', color: conditionColors[listing.condition], padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 700 }}>
                ● {listing.condition}
              </span>
              <span style={{ background: 'var(--surface3)', color: 'var(--text2)', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>{listing.category}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800, color: 'var(--text)', marginBottom: 12, lineHeight: 1.2 }}>{listing.title}</h1>

            {listing.type === 'sell' && (
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>₹{listing.price?.toLocaleString('en-IN')}</span>
                {listing.negotiable && <span style={{ fontSize: 13, color: 'var(--text3)', marginLeft: 8, fontWeight: 500 }}>• Negotiable</span>}
              </div>
            )}
            {listing.type === 'exchange' && (
              <div style={{ marginBottom: 16, background: 'var(--surface3)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                <p style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 600, marginBottom: 4 }}>LOOKING TO EXCHANGE FOR</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{listing.exchangeFor}</p>
              </div>
            )}

            {/* Description */}
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</h3>
              <p style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{listing.description}</p>
            </div>

            {/* Details */}
            {(listing.subject || listing.semester) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {listing.subject && <span style={{ background: 'var(--surface3)', padding: '4px 12px', borderRadius: 100, fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>📖 {listing.subject}</span>}
                {listing.semester && <span style={{ background: 'var(--surface3)', padding: '4px 12px', borderRadius: 100, fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>📅 {listing.semester}</span>}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, color: 'var(--text3)', fontSize: 13 }}>
              <span>👁 {listing.views || 0} views</span>
              <span>❤️ {listing.savedBy?.length || 0} saves</span>
              <span>🕐 {listing.createdAt ? formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true }) : ''}</span>
            </div>

            {/* Seller card */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 20 }}>
              <Link to={`/profile/${listing.seller?._id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: 18, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                  {listing.seller?.avatar ? <img src={listing.seller.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : listing.seller?.name?.[0]}
                  {listing.seller?.isOnline && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)', border: '2px solid white', position: 'absolute', bottom: 1, right: 1 }} />}
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{listing.seller?.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>{listing.seller?.college} • {listing.seller?.department}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ fontSize: 12, color: i < Math.round(listing.seller?.rating?.average || 0) ? '#FFD93D' : '#ddd' }}>★</span>
                    ))}
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>({listing.seller?.rating?.count || 0} ratings)</span>
                    {listing.seller?.isOnline ? <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>● Online</span> : <span style={{ fontSize: 12, color: 'var(--text3)' }}>● {listing.seller?.lastSeen ? formatDistanceToNow(new Date(listing.seller.lastSeen), { addSuffix: true }) : 'Offline'}</span>}
                  </div>
                </div>
              </Link>
            </div>

            {/* Action buttons */}
            {isOwner ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link to={`/edit-listing/${id}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>✏️ Edit Listing</Link>
                  <button onClick={handleDelete} disabled={deleting} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                    {deleting ? '...' : '🗑️ Delete'}
                  </button>
                </div>
                {listing.status === 'active' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleStatusChange('sold')} disabled={statusLoading} className="btn" style={{ flex: 1, justifyContent: 'center', background: '#E8F5E9', color: '#2E7D32', border: '1px solid #C8E6C9' }}>
                      ✅ Mark as Sold
                    </button>
                    <button onClick={() => handleStatusChange('reserved')} disabled={statusLoading} className="btn" style={{ flex: 1, justifyContent: 'center', background: '#E3F2FD', color: '#1565C0', border: '1px solid #BBDEFB' }}>
                      🔒 Reserve
                    </button>
                  </div>
                )}
                {listing.status !== 'active' && (
                  <button onClick={() => handleStatusChange('active')} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                    ↩️ Re-activate
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleContact} disabled={listing.status !== 'active'} className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '13px', fontSize: 15, opacity: listing.status !== 'active' ? 0.6 : 1 }}>
                  💬 Contact Seller
                </button>
                <button onClick={handleSave} disabled={saving} className="btn btn-secondary"
                  style={{ padding: '13px 16px', fontSize: 18 }}>
                  {saved ? '❤️' : '🤍'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .listing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function getCategoryEmoji(c) {
  const m = { textbooks: '📚', notes: '📝', electronics: '💻', 'lab-equipment': '🔬', stationery: '✏️', sports: '⚽', clothing: '👕', furniture: '🪑', cycles: '🚲', calculators: '🔢', software: '💾', other: '📦' };
  return m[c] || '📦';
}
