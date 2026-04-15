import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate', 'PhD'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', college: '', department: '', year: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleStep1 = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await register({ name: form.name, email: form.email, password: form.password, college: form.college, department: form.department, year: form.year });
      toast.success(data.message || 'Account created! Check your email for verification.');
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Registration failed';
      toast.error(msg);
      if (msg.includes('email')) setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1A1035 0%, #2D1B69 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎓</div>
            <span style={{ fontWeight: 800, fontSize: 24, color: 'white', letterSpacing: '-0.5px' }}>CampusMarket</span>
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 14 }}>Create your student account</p>
        </div>

        <div style={{ background: 'white', borderRadius: 'var(--radius-xl)', padding: '36px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {/* Steps indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, gap: 8 }}>
            {[1, 2].map(s => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= s ? 'var(--primary)' : 'var(--surface3)', color: step >= s ? 'white' : 'var(--text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, transition: 'var(--transition)' }}>{s}</div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: step >= s ? 'var(--text)' : 'var(--text3)' }}>{s === 1 ? 'Account' : 'College Info'}</span>
                </div>
                {s < 2 && <div style={{ flex: 1, height: 2, background: step > s ? 'var(--primary)' : 'var(--border)', borderRadius: 2, transition: 'var(--transition)' }} />}
              </React.Fragment>
            ))}
          </div>

          {step === 1 ? (
            <form onSubmit={handleStep1} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>Create account 🚀</h2>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input name="name" type="text" value={form.name} onChange={handleChange} className="input" placeholder="Your full name" required />
              </div>
              <div className="input-group">
                <label className="input-label">College Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="you@college.edu" required />
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Must be a valid college email (.edu, .ac.in, etc.)</p>
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} className="input" placeholder="Min. 6 characters" required style={{ paddingRight: 48 }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>{showPassword ? '🙈' : '👁'}</button>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Confirm Password</label>
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="input" placeholder="Repeat password" required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 4 }}>
                Continue →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: 'var(--text)' }}>College details 🎓</h2>
              <div className="input-group">
                <label className="input-label">College/University Name *</label>
                <input name="college" type="text" value={form.college} onChange={handleChange} className="input" placeholder="e.g. IIT Bombay, BITS Pilani" required />
              </div>
              <div className="input-group">
                <label className="input-label">Department</label>
                <input name="department" type="text" value={form.department} onChange={handleChange} className="input" placeholder="e.g. Computer Science, Mechanical" />
              </div>
              <div className="input-group">
                <label className="input-label">Year of Study</label>
                <select name="year" value={form.year} onChange={handleChange} className="input">
                  <option value="">Select year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '13px' }}>← Back</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '13px', fontSize: 15 }}>
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Creating...
                    </span>
                  ) : 'Create Account 🎉'}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: 20, textAlign: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, color: 'var(--text3)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
