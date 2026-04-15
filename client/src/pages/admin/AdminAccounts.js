import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout';

const dk = { card: '#1E293B', border: '#334155', text: 'white', muted: '#94A3B8', subtle: '#64748B', input: '#0F172A' };
const adminAxios = () => axios.create({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

export default function AdminAccounts() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'moderator' });
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const me = JSON.parse(localStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    adminAxios().get('/api/admin/admins')
      .then(({ data }) => setAdmins(data))
      .catch(err => {
        if (err?.response?.status === 403) setError('Only super admins can manage admin accounts');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setCreating(true);
    try {
      const { data } = await adminAxios().post('/api/admin/admins', form);
      setAdmins(prev => [data.admin, ...prev]);
      setForm({ name: '', email: '', password: '', role: 'moderator' });
      setShowForm(false);
      setSuccess('Admin account created successfully!');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create admin');
    } finally { setCreating(false); }
  };

  if (me.role !== 'super_admin') {
    return (
      <AdminLayout title="Admin Accounts">
        <div style={{ background: dk.card, borderRadius: 14, padding: 40, textAlign: 'center', border: `1px solid ${dk.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h3 style={{ color: dk.text, fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Super Admin Only</h3>
          <p style={{ color: dk.subtle, fontSize: 14 }}>Only super admins can manage admin accounts.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Accounts">
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <p style={{ color: dk.muted, fontSize: 14 }}>{admins.length} admin account{admins.length !== 1 ? 's' : ''}</p>
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '9px 18px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {showForm ? '✕ Cancel' : '+ New Admin'}
          </button>
        </div>

        {success && <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px 16px', color: '#4ADE80', fontSize: 14, marginBottom: 16 }}>✅ {success}</div>}
        {error && <div style={{ background: '#450A0A', border: '1px solid #7F1D1D', borderRadius: 10, padding: '12px 16px', color: '#FCA5A5', fontSize: 14, marginBottom: 16 }}>⚠️ {error}</div>}

        {/* Create form */}
        {showForm && (
          <div style={{ background: dk.card, borderRadius: 14, padding: 24, border: `1px solid ${dk.border}`, marginBottom: 20 }}>
            <h3 style={{ color: dk.text, fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Create New Admin</h3>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Admin Name' },
                { key: 'email', label: 'Email', type: 'email', placeholder: 'admin@example.com' },
                { key: 'password', label: 'Password (min 8 chars)', type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key} style={{ gridColumn: f.key === 'password' ? '1' : undefined }}>
                  <label style={{ display: 'block', color: dk.subtle, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} required
                    style={{ width: '100%', padding: '10px 12px', background: dk.input, border: `1px solid ${dk.border}`, borderRadius: 8, color: dk.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', color: dk.subtle, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Role</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', background: dk.input, border: `1px solid ${dk.border}`, borderRadius: 8, color: dk.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
                  <option value="moderator">Moderator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="submit" disabled={creating}
                  style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', border: 'none', borderRadius: 8, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: creating ? 0.7 : 1 }}>
                  {creating ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admins list */}
        <div style={{ background: dk.card, borderRadius: 14, border: `1px solid ${dk.border}`, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24, color: dk.subtle }}>Loading...</div>
          ) : admins.map((admin, i) => (
            <div key={admin._id} style={{ padding: '16px 20px', borderBottom: i < admins.length - 1 ? `1px solid ${dk.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: 16, flexShrink: 0 }}>
                  {admin.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p style={{ color: dk.text, fontWeight: 700, fontSize: 15 }}>{admin.name} {admin._id === me._id && <span style={{ fontSize: 11, color: '#6366F1', fontWeight: 600 }}>(you)</span>}</p>
                  <p style={{ color: dk.subtle, fontSize: 12 }}>{admin.email}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: admin.role === 'super_admin' ? 'rgba(139,92,246,0.2)' : 'rgba(100,116,139,0.15)', color: admin.role === 'super_admin' ? '#A78BFA' : '#94A3B8' }}>
                  {admin.role === 'super_admin' ? '🛡️ Super Admin' : '👤 Moderator'}
                </span>
                <p style={{ color: dk.subtle, fontSize: 12 }}>
                  {admin.lastLogin ? `Last login: ${new Date(admin.lastLogin).toLocaleDateString()}` : 'Never logged in'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
