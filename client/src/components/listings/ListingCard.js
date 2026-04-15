import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const typeColors = {
  sell: { bg: '#E8F5E9', color: '#2E7D32', label: '₹ Sell' },
  exchange: { bg: '#E3F2FD', color: '#1565C0', label: '⇄ Exchange' },
  free: { bg: '#FFF3E0', color: '#E65100', label: '🎁 Free' }
};

const conditionColors = {
  new: '#6BCB77', 'like-new': '#4CAF50', good: '#FFB74D', fair: '#FF9800', poor: '#EF5350'
};

export default function ListingCard({ listing, onSaveToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(listing.savedBy?.includes(user?._id));
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setSaving(true);
    try {
      const { data } = await axios.post(`/api/listings/${listing._id}/save`);
      setSaved(data.saved);
      toast.success(data.saved ? 'Saved!' : 'Removed from saved');
      if (onSaveToggle) onSaveToggle(listing._id, data.saved);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const typeInfo = typeColors[listing.type] || typeColors.sell;
  const img = !imgError && listing.images?.[0]?.url;

  return (
    <Link to={`/listings/${listing._id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
        overflow: 'hidden', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        cursor: 'pointer', position: 'relative'
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>

        {/* Image */}
        <div style={{ position: 'relative', paddingTop: '70%', background: 'var(--surface3)', overflow: 'hidden' }}>
          {img ? (
            <img src={img} alt={listing.title} onError={() => setImgError(true)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
              {getCategoryEmoji(listing.category)}
            </div>
          )}

          {/* Save button */}
          <button onClick={handleSave}
            style={{
              position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'var(--transition)',
              opacity: saving ? 0.7 : 1
            }}>
            {saved ? '❤️' : '🤍'}
          </button>

          {/* Status badge */}
          {listing.status !== 'active' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ background: 'white', padding: '6px 16px', borderRadius: 100, fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                {listing.status === 'sold' ? '✅ Sold' : listing.status === 'reserved' ? '🔒 Reserved' : listing.status}
              </span>
            </div>
          )}

          {/* Type badge */}
          <div style={{ position: 'absolute', top: 10, left: 10, background: typeInfo.bg, color: typeInfo.color, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700 }}>
            {typeInfo.label}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {listing.title}
            </h3>
            {listing.type === 'sell' && (
              <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--primary)', flexShrink: 0 }}>
                ₹{listing.price?.toLocaleString('en-IN')}
                {listing.negotiable && <span style={{ fontSize: 10, color: 'var(--text3)', display: 'block', textAlign: 'right', fontWeight: 600 }}>negotiable</span>}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'white', background: conditionColors[listing.condition] || '#ccc', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>
              ● {listing.condition}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📚 {listing.category}
            </span>
          </div>

          {/* Seller info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primary)', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
              {listing.seller?.avatar ? <img src={listing.seller.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : listing.seller?.name?.[0]?.toUpperCase()}
              {listing.seller?.isOnline && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', border: '1.5px solid white', position: 'absolute', bottom: 0, right: 0 }} />}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {listing.seller?.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
              👁 {listing.views || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function getCategoryEmoji(category) {
  const map = {
    textbooks: '📚', notes: '📝', electronics: '💻', 'lab-equipment': '🔬',
    stationery: '✏️', sports: '⚽', clothing: '👕', furniture: '🪑',
    cycles: '🚲', calculators: '🔢', software: '💾', other: '📦'
  };
  return map[category] || '📦';
}
