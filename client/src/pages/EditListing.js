import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['textbooks', 'notes', 'electronics', 'lab-equipment', 'stationery', 'sports', 'clothing', 'furniture', 'cycles', 'calculators', 'software', 'other'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'];
const emojis = { textbooks: '📚', notes: '📝', electronics: '💻', 'lab-equipment': '🔬', stationery: '✏️', sports: '⚽', clothing: '👕', furniture: '🪑', cycles: '🚲', calculators: '🔢', software: '💾', other: '📦' };

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', price: '', type: 'sell', exchangeFor: '',
    category: '', condition: 'good', subject: '', semester: '', negotiable: false, tags: ''
  });

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data } = await axios.get(`/api/listings/${id}`);
      if (data.seller._id !== user?._id) {
        toast.error('Not authorized to edit this listing');
        navigate('/my-listings');
        return;
      }
      setForm({
        title: data.title || '',
        description: data.description || '',
        price: data.price || '',
        type: data.type || 'sell',
        exchangeFor: data.exchangeFor || '',
        category: data.category || '',
        condition: data.condition || 'good',
        subject: data.subject || '',
        semester: data.semester || '',
        negotiable: data.negotiable || false,
        tags: (data.tags || []).join(', ')
      });
      setImages(data.images || []);
    } catch {
      toast.error('Failed to load listing');
      navigate('/my-listings');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImages = async (e) => {
    const files = Array.from(e.target.files).slice(0, 5 - images.length);
    if (!files.length) return;
    setUploading(true);
    const base64s = await Promise.all(files.map(file => new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    })));
    try {
      const { data } = await axios.post('/api/listings/upload-images', { images: base64s });
      setImages(prev => [...prev, ...data.images]);
      toast.success('Images uploaded!');
    } catch {
      setImages(prev => [...prev, ...base64s.map(b => ({ url: b, public_id: null }))]);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) { toast.error('Please select a category'); return; }
    if (form.type === 'sell' && (!form.price || form.price <= 0)) { toast.error('Please enter a valid price'); return; }
    setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), images };
      await axios.put(`/api/listings/${id}`, payload);
      toast.success('Listing updated! ✅');
      navigate(`/listings/${id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />
      <div className="container" style={{ padding: '40px 20px', maxWidth: 800 }}>
        {[240, 180, 160, 120].map((h, i) => <div key={i} className="skeleton" style={{ height: h, borderRadius: 'var(--radius-lg)', marginBottom: 20 }} />)}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />
      <div className="container" style={{ padding: '32px 20px', maxWidth: 800 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Edit Listing ✏️</h1>
          <p style={{ color: 'var(--text3)' }}>Update your listing details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Listing Type */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Listing Type</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { value: 'sell', label: 'Sell', icon: '💰', desc: 'Set a price' },
                  { value: 'exchange', label: 'Exchange', icon: '⇄', desc: 'Trade for something' },
                  { value: 'free', label: 'Free', icon: '🎁', desc: 'Give it away' }
                ].map(t => (
                  <div key={t.value} onClick={() => setForm(p => ({ ...p, type: t.value }))}
                    style={{ padding: '16px 12px', borderRadius: 'var(--radius-md)', border: `2px solid ${form.type === t.value ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'center', background: form.type === t.value ? 'var(--surface3)' : 'white', transition: 'var(--transition)' }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{t.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: form.type === t.value ? 'var(--primary)' : 'var(--text)' }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Basic Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input name="title" value={form.title} onChange={handleChange} className="input" placeholder="e.g. Engineering Maths Vol 1" required maxLength={100} />
                </div>
                <div className="input-group">
                  <label className="input-label">Description *</label>
                  <textarea name="description" value={form.description} onChange={handleChange} className="input" placeholder="Describe the condition, edition, any damage..." required rows={4} style={{ resize: 'vertical' }} maxLength={1000} />
                </div>
                {form.type === 'sell' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Price (₹) *</label>
                      <input name="price" type="number" value={form.price} onChange={handleChange} className="input" placeholder="e.g. 250" min={1} required />
                    </div>
                    <div className="input-group" style={{ justifyContent: 'flex-end', paddingTop: 28 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>
                        <input type="checkbox" name="negotiable" checked={form.negotiable} onChange={handleChange} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                        Price is negotiable
                      </label>
                    </div>
                  </div>
                )}
                {form.type === 'exchange' && (
                  <div className="input-group">
                    <label className="input-label">Looking to Exchange For *</label>
                    <input name="exchangeFor" value={form.exchangeFor} onChange={handleChange} className="input" placeholder="e.g. Physics textbook, calculator..." required />
                  </div>
                )}
              </div>
            </div>

            {/* Category & Condition */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Category & Condition</h3>
              <div style={{ marginBottom: 16 }}>
                <label className="input-label" style={{ marginBottom: 10, display: 'block' }}>Category *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                  {CATEGORIES.map(cat => (
                    <div key={cat} onClick={() => setForm(p => ({ ...p, category: cat }))}
                      style={{ padding: '10px 8px', borderRadius: 'var(--radius-md)', border: `2px solid ${form.category === cat ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', textAlign: 'center', background: form.category === cat ? 'var(--surface3)' : 'white', transition: 'var(--transition)', fontSize: 11 }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{emojis[cat]}</div>
                      <span style={{ fontWeight: 600, color: form.category === cat ? 'var(--primary)' : 'var(--text2)' }}>{cat.replace('-', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Condition *</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CONDITIONS.map(c => (
                    <div key={c} onClick={() => setForm(p => ({ ...p, condition: c }))}
                      style={{ padding: '8px 16px', borderRadius: 100, border: `2px solid ${form.condition === c ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: form.condition === c ? 'var(--primary)' : 'white', color: form.condition === c ? 'white' : 'var(--text2)', transition: 'var(--transition)' }}>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Academic Details */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Academic Details <span style={{ fontWeight: 400, color: 'var(--text3)', fontSize: 13 }}>(optional)</span></h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                <div className="input-group">
                  <label className="input-label">Subject</label>
                  <input name="subject" value={form.subject} onChange={handleChange} className="input" placeholder="e.g. Calculus" />
                </div>
                <div className="input-group">
                  <label className="input-label">Semester</label>
                  <select name="semester" value={form.semester} onChange={handleChange} className="input">
                    <option value="">Select semester</option>
                    {['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6','Semester 7','Semester 8','Annual'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group" style={{ marginTop: 12 }}>
                <label className="input-label">Tags</label>
                <input name="tags" value={form.tags} onChange={handleChange} className="input" placeholder="e.g. JEE, GATE, Python (comma separated)" />
              </div>
            </div>

            {/* Images */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Photos</h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Up to 5 photos. First is the cover image.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--border)' }}>
                    <img src={img.url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    {i === 0 && <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 100 }}>COVER</span>}
                    <button type="button" onClick={() => removeImage(i)}
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label style={{ paddingTop: '100%', position: 'relative', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)', cursor: 'pointer', display: 'block' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {uploading ? <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><span style={{ fontSize: 24 }}>📸</span><span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>Add photo</span></>}
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handleImages} style={{ display: 'none' }} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => navigate(`/listings/${id}`)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: 14, fontSize: 15 }}>Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: 14, fontSize: 15 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Saving...
                  </span>
                ) : '✅ Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
