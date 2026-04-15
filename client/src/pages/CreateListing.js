import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['textbooks', 'notes', 'electronics', 'lab-equipment', 'stationery', 'sports', 'clothing', 'furniture', 'cycles', 'calculators', 'software', 'other'];
const CONDITIONS = ['new', 'like-new', 'good', 'fair', 'poor'];
const SEMESTERS = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Annual'];

const emojis = { textbooks: '📚', notes: '📝', electronics: '💻', 'lab-equipment': '🔬', stationery: '✏️', sports: '⚽', clothing: '👕', furniture: '🪑', cycles: '🚲', calculators: '🔢', software: '💾', other: '📦' };

export default function CreateListing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', price: '', type: 'sell', exchangeFor: '',
    category: '', condition: 'good', subject: '', semester: '', negotiable: false, tags: ''
  });

  if (!user?.isVerified) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
        <Navbar />
        <div style={{ maxWidth: 500, margin: '80px auto', padding: 20, textAlign: 'center' }}>
          <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: 48, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Verify Your Email First</h2>
            <p style={{ color: 'var(--text3)', marginBottom: 24, lineHeight: 1.6 }}>You need to verify your college email before you can create listings. Check your inbox for the verification link.</p>
            <button onClick={() => axios.post('/api/auth/resend-verification').then(() => toast.success('Verification email sent!')).catch(() => toast.error('Failed to send'))}
              className="btn btn-primary" style={{ justifyContent: 'center', width: '100%', padding: 14 }}>
              Resend Verification Email
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      toast.success(`${data.images.length} image(s) uploaded!`);
    } catch {
      // Fallback: use local base64 previews
      const localImages = base64s.map(b => ({ url: b, public_id: null }));
      setImages(prev => [...prev, ...localImages]);
      toast.success('Images ready (will be saved with listing)');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) { toast.error('Please select a category'); return; }
    if (form.type === 'sell' && (!form.price || form.price <= 0)) { toast.error('Please enter a valid price'); return; }
    if (form.type === 'exchange' && !form.exchangeFor) { toast.error('Please specify what you want to exchange for'); return; }

    setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), images };
      const { data } = await axios.post('/api/listings', payload);
      toast.success('Listing created! 🎉');
      navigate(`/listings/${data._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />
      <div className="container" style={{ padding: '32px 20px', maxWidth: 800 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Create a Listing ✨</h1>
          <p style={{ color: 'var(--text3)' }}>List your item and connect with potential buyers on campus</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Listing Type */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>Listing Type</h3>
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

            {/* Basic info */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>Basic Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Title *</label>
                  <input name="title" value={form.title} onChange={handleChange} className="input" placeholder="e.g. Engineering Mathematics Vol 1 – 3rd Edition" required maxLength={100} />
                  <span style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>{form.title.length}/100</span>
                </div>

                <div className="input-group">
                  <label className="input-label">Description *</label>
                  <textarea name="description" value={form.description} onChange={handleChange} className="input" placeholder="Describe the condition, edition, any highlights or damage..." required rows={4} style={{ resize: 'vertical' }} maxLength={1000} />
                  <span style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>{form.description.length}/1000</span>
                </div>

                {form.type === 'sell' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Price (₹) *</label>
                      <input name="price" type="number" value={form.price} onChange={handleChange} className="input" placeholder="e.g. 250" min={1} required />
                    </div>
                    <div className="input-group" style={{ justifyContent: 'flex-end', paddingTop: 28 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                        <input type="checkbox" name="negotiable" checked={form.negotiable} onChange={handleChange} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                        Price is negotiable
                      </label>
                    </div>
                  </div>
                )}

                {form.type === 'exchange' && (
                  <div className="input-group">
                    <label className="input-label">Looking to Exchange For *</label>
                    <input name="exchangeFor" value={form.exchangeFor} onChange={handleChange} className="input" placeholder="e.g. Physics textbook, calculator, lab coat..." required />
                  </div>
                )}
              </div>
            </div>

            {/* Category & Condition */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>Category & Condition</h3>
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

            {/* Academic info (optional) */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>Academic Details <span style={{ fontWeight: 400, color: 'var(--text3)', fontSize: 13 }}>(optional)</span></h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Help buyers find your item more easily</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Subject</label>
                  <input name="subject" value={form.subject} onChange={handleChange} className="input" placeholder="e.g. Calculus, Thermodynamics" />
                </div>
                <div className="input-group">
                  <label className="input-label">Semester</label>
                  <select name="semester" value={form.semester} onChange={handleChange} className="input">
                    <option value="">Select semester</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group" style={{ marginTop: 12 }}>
                <label className="input-label">Tags (comma separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange} className="input" placeholder="e.g. JEE, GATE, Python, Organic Chemistry" />
              </div>
            </div>

            {/* Images */}
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 24, border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>Photos</h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>Add up to 5 photos. First photo will be the cover.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', paddingTop: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '2px solid var(--border)' }}>
                    <img src={img.url} alt={`img-${i}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    {i === 0 && <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 100 }}>COVER</span>}
                    <button onClick={() => removeImage(i)} type="button"
                      style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                {images.length < 5 && (
                  <label style={{ paddingTop: '100%', position: 'relative', borderRadius: 'var(--radius-md)', border: '2px dashed var(--border)', cursor: 'pointer', display: 'block', background: uploading ? 'var(--surface3)' : 'white', transition: 'var(--transition)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {uploading ? (
                        <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      ) : (
                        <>
                          <span style={{ fontSize: 24 }}>📸</span>
                          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>Add photo</span>
                        </>
                      )}
                    </div>
                    <input type="file" accept="image/*" multiple onChange={handleImages} style={{ display: 'none' }} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: 14, fontSize: 15 }}>Cancel</button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: 14, fontSize: 15 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Creating listing...
                  </span>
                ) : '🚀 Publish Listing'}
              </button>
            </div>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
