import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ReviewModal({ isOpen, onClose, reviewee, listingId, listingTitle, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Please select a star rating'); return; }
    setLoading(true);
    try {
      const review = await axios.post('/api/reviews', {
        revieweeId: reviewee._id,
        listingId: listingId || null,
        rating,
        comment
      });
      toast.success('Review submitted! ⭐');
      if (onReviewSubmitted) onReviewSubmitted(review.data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 36, maxWidth: 440, width: '100%', boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.2s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>Rate & Review ⭐</h2>
            <p style={{ fontSize: 14, color: 'var(--text3)' }}>
              {listingTitle ? <>For listing: <strong style={{ color: 'var(--text)' }}>{listingTitle}</strong></> : <>Seller: <strong style={{ color: 'var(--text)' }}>{reviewee?.name}</strong></>}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface3)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>✕</button>
        </div>

        {/* Seller info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: 18, overflow: 'hidden', flexShrink: 0 }}>
            {reviewee?.avatar ? <img src={reviewee.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : reviewee?.name?.[0]}
          </div>
          <div>
            <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{reviewee?.name}</p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>{reviewee?.college}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star rating */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Rating</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 40, lineHeight: 1, transition: 'transform 0.1s ease', transform: (hovered >= star || rating >= star) ? 'scale(1.15)' : 'scale(1)', filter: (hovered >= star || rating >= star) ? 'none' : 'grayscale(1) opacity(0.4)' }}>
                  ⭐
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>{labels[hovered || rating]}</p>
            )}
          </div>

          {/* Comment */}
          <div className="input-group" style={{ marginBottom: 20 }}>
            <label className="input-label">Comment <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            <textarea value={comment} onChange={e => setComment(e.target.value)} className="input"
              placeholder="How was your experience with this seller? Was the item as described?"
              rows={3} style={{ resize: 'vertical' }} maxLength={400} />
            <span style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>{comment.length}/400</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>Cancel</button>
            <button type="submit" disabled={loading || !rating} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '12px', opacity: (!rating) ? 0.6 : 1 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Submitting...
                </span>
              ) : 'Submit Review ⭐'}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
