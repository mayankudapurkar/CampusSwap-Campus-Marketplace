import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import ListingCard from '../components/listings/ListingCard';
import ReviewModal from '../components/listings/ReviewModal';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

function StarDisplay({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.round(rating) ? '#FFD93D' : '#ddd', lineHeight: 1 }}>★</span>
      ))}
    </span>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('listings');

  const isOwn = currentUser?._id === id;

  useEffect(() => {
    fetchProfile();
    fetchListings();
    fetchReviews();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`/api/users/${id}`);
      setProfileUser(data);
      setEditForm({ name: data.name, bio: data.bio || '', phone: data.phone || '', department: data.department || '', year: data.year || '' });
    } catch {
      toast.error('User not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      const { data } = await axios.get(`/api/users/${id}/listings`);
      setListings(Array.isArray(data) ? data : data.listings || []);
    } catch {}
  };

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`/api/reviews/user/${id}`);
      setReviews(data);
    } catch {}
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await axios.put('/api/users/profile/update', editForm);
      setProfileUser(data);
      updateUser(data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleContact = async () => {
    if (!currentUser) { navigate('/login'); return; }
    try {
      const { data } = await axios.post('/api/chat/conversations', { recipientId: id });
      navigate(`/chat/${data._id}`);
    } catch {
      toast.error('Failed to start chat');
    }
  };

  const handleReviewSubmitted = (review) => {
    setReviews(prev => [review, ...prev]);
    fetchProfile(); // Refresh rating
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />
      <div className="container" style={{ padding: '40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
          <div className="skeleton" style={{ height: 420, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton" style={{ height: 420, borderRadius: 'var(--radius-xl)' }} />
        </div>
      </div>
    </div>
  );

  if (!profileUser) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        reviewee={profileUser}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <div className="container" style={{ padding: '32px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'flex-start' }}>

          {/* ── Sidebar ── */}
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: 80, background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }} />
              <div style={{ padding: '0 24px 24px', marginTop: -44 }}>

                {/* Avatar */}
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 12 }}>
                  <div style={{ width: 84, height: 84, borderRadius: '50%', border: '4px solid white', background: 'var(--surface3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>
                    {profileUser.avatar ? <img src={profileUser.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profileUser.name?.[0]?.toUpperCase()}
                  </div>
                  {profileUser.isOnline && <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--success)', border: '3px solid white', position: 'absolute', bottom: 4, right: 4 }} />}
                </div>

                {editing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="input" style={{ padding: '8px 12px' }} placeholder="Name" />
                    <textarea value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} className="input" placeholder="Bio (max 200 chars)" rows={3} style={{ resize: 'none', padding: '8px 12px' }} maxLength={200} />
                    <input value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))} className="input" style={{ padding: '8px 12px' }} placeholder="Department" />
                    <select value={editForm.year} onChange={e => setEditForm(p => ({ ...p, year: e.target.value }))} className="input" style={{ padding: '8px 12px' }}>
                      <option value="">Select year</option>
                      {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'PhD'].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditing(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '8px' }}>Cancel</button>
                      <button onClick={handleSaveProfile} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '8px' }}>
                        {saving ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{profileUser.name}</h1>
                    <p style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginBottom: 4 }}>🎓 {profileUser.college}</p>
                    {profileUser.department && <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>{profileUser.department}{profileUser.year && ` • ${profileUser.year}`}</p>}
                    {profileUser.bio && <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5, margin: '8px 0', padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-md)' }}>{profileUser.bio}</p>}

                    {/* Rating summary */}
                    <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-md)', margin: '10px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StarDisplay rating={profileUser.rating?.average || 0} size={16} />
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{profileUser.rating?.average?.toFixed(1) || '—'}</span>
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>({profileUser.rating?.count || 0} reviews)</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                      {[
                        { label: 'Listings', value: listings.length, icon: '📦' },
                        { label: 'Sales', value: profileUser.totalSales || 0, icon: '✅' }
                      ].map((s, i) => (
                        <div key={i} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-md)', padding: 10, textAlign: 'center' }}>
                          <div style={{ fontSize: 18 }}>{s.icon}</div>
                          <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>{s.value}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
                      {profileUser.isOnline ? '🟢 Online now' : profileUser.lastSeen ? `⚫ ${formatDistanceToNow(new Date(profileUser.lastSeen), { addSuffix: true })}` : ''}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {isOwn ? (
                        <button onClick={() => setEditing(true)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>✏️ Edit Profile</button>
                      ) : (
                        <>
                          {currentUser && (
                            <button onClick={handleContact} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>💬 Send Message</button>
                          )}
                          {currentUser && (
                            <button onClick={() => setReviewModalOpen(true)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>⭐ Rate & Review</button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {!profileUser.isVerified && isOwn && (
              <div style={{ background: '#FFF8E1', border: '1px solid #FFD93D', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#E65100', marginBottom: 4 }}>⚠️ Email Not Verified</p>
                <p style={{ fontSize: 12, color: '#BF6000' }}>Verify your college email to post listings.</p>
              </div>
            )}
          </div>

          {/* ── Main content ── */}
          <div style={{ animation: 'fadeIn 0.4s ease 0.1s both' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white', padding: 4, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', width: 'fit-content' }}>
              {[
                { key: 'listings', label: `Listings (${listings.length})` },
                { key: 'reviews', label: `Reviews (${reviews.length})` }
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit', background: activeTab === tab.key ? 'var(--primary)' : 'transparent', color: activeTab === tab.key ? 'white' : 'var(--text2)', transition: 'var(--transition)' }}>
                  {tab.label}
                </button>
              ))}
              {isOwn && <Link to="/create-listing" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>+ New</Link>}
            </div>

            {/* Listings tab */}
            {activeTab === 'listings' && (
              listings.length === 0 ? (
                <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '60px 20px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>📦</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No listings yet</h3>
                  {isOwn ? (
                    <Link to="/create-listing" className="btn btn-primary" style={{ marginTop: 8 }}>Create First Listing</Link>
                  ) : <p style={{ color: 'var(--text3)' }}>This user hasn't listed anything yet.</p>}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                  {listings.map((l, i) => (
                    <div key={l._id} style={{ animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                      <ListingCard listing={l} />
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Reviews tab */}
            {activeTab === 'reviews' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!isOwn && currentUser && (
                  <button onClick={() => setReviewModalOpen(true)} className="btn btn-primary" style={{ alignSelf: 'flex-start', gap: 6 }}>
                    ⭐ Write a Review
                  </button>
                )}
                {reviews.length === 0 ? (
                  <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '60px 20px', textAlign: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>⭐</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No reviews yet</h3>
                    <p style={{ color: 'var(--text3)' }}>Be the first to review this seller!</p>
                  </div>
                ) : reviews.map((review, i) => (
                  <div key={review._id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '18px 20px', border: '1px solid var(--border)', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)', overflow: 'hidden', flexShrink: 0, fontSize: 16 }}>
                        {review.reviewer?.avatar ? <img src={review.reviewer.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : review.reviewer?.name?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                          <div>
                            <Link to={`/profile/${review.reviewer?._id}`} style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}>{review.reviewer?.name}</Link>
                            <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>{review.reviewer?.college}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <StarDisplay rating={review.rating} size={14} />
                            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                        {review.listing && (
                          <Link to={`/listings/${review.listing._id}`} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500, textDecoration: 'none', marginBottom: 6, display: 'block' }}>
                            re: {review.listing.title}
                          </Link>
                        )}
                        {review.comment && <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{review.comment}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
