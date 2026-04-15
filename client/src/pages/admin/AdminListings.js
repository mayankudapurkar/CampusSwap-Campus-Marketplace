import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout';

const dk = { card: '#1E293B', border: '#334155', text: 'white', muted: '#94A3B8', subtle: '#64748B', input: '#0F172A' };
const CATEGORIES = ['all','textbooks','notes','electronics','lab-equipment','stationery','sports','clothing','furniture','cycles','calculators','software','other'];
const STATUS_COLORS = { active: { bg: 'rgba(34,197,94,0.15)', color: '#4ADE80' }, sold: { bg: 'rgba(99,102,241,0.15)', color: '#A78BFA' }, reserved: { bg: 'rgba(234,179,8,0.1)', color: '#FACC15' }, expired: { bg: 'rgba(100,116,139,0.15)', color: '#94A3B8' } };
const adminAxios = () => axios.create({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, sort: '-createdAt' });
      if (search) params.set('search', search);
      if (status !== 'all') params.set('status', status);
      if (category !== 'all') params.set('category', category);
      const { data } = await adminAxios().get(`/api/admin/listings?${params}`);
      setListings(data.listings);
      setPagination({ total: data.total, pages: data.pages, page: data.page });
    } catch {} finally { setLoading(false); }
  }, [page, search, status, category]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(id + newStatus);
    try {
      await adminAxios().patch(`/api/admin/listings/${id}/status`, { status: newStatus });
      fetchListings();
      if (selected?._id === id) setSelected(prev => ({ ...prev, status: newStatus }));
    } catch (err) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(''); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    setActionLoading(id + 'delete');
    try {
      await adminAxios().delete(`/api/admin/listings/${id}`);
      setSelected(null);
      fetchListings();
    } catch {} finally { setActionLoading(''); }
  };

  return (
    <AdminLayout title="Listing Management">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* List */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search title, description..."
              style={{ flex: 1, minWidth: 180, padding: '10px 14px', background: dk.input, border: `1px solid ${dk.border}`, borderRadius: 10, color: dk.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
              style={{ padding: '10px 12px', background: dk.input, border: `1px solid ${dk.border}`, borderRadius: 10, color: dk.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              {['all','active','sold','reserved','expired'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
              style={{ padding: '10px 12px', background: dk.input, border: `1px solid ${dk.border}`, borderRadius: 10, color: dk.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ background: dk.card, borderRadius: 14, border: `1px solid ${dk.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${dk.border}` }}>
                  {['Listing', 'Seller', 'Price', 'Category', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', color: dk.subtle, fontSize: 11, fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(8)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${dk.border}` }}>
                    {[...Array(6)].map((_, j) => <td key={j} style={{ padding: '14px' }}><div style={{ height: 11, background: '#334155', borderRadius: 4, animation: 'pulse 1.5s infinite' }} /></td>)}
                  </tr>
                )) : listings.map(listing => {
                  const sc = STATUS_COLORS[listing.status] || STATUS_COLORS.expired;
                  return (
                    <tr key={listing._id} style={{ borderBottom: `1px solid ${dk.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                      onClick={() => setSelected(listing)}
                      onMouseEnter={e => e.currentTarget.style.background = '#263548'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {listing.images?.[0]?.url ? (
                            <img src={listing.images[0].url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 6, background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📦</div>
                          )}
                          <p style={{ color: dk.text, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{listing.title}</p>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', color: dk.muted, fontSize: 12 }}>{listing.seller?.name}<br /><span style={{ color: dk.subtle, fontSize: 11 }}>{listing.seller?.college}</span></td>
                      <td style={{ padding: '11px 14px', color: dk.muted, fontSize: 13, fontWeight: 600 }}>
                        {listing.type === 'sell' ? `₹${listing.price?.toLocaleString('en-IN')}` : listing.type}
                      </td>
                      <td style={{ padding: '11px 14px', color: dk.subtle, fontSize: 12 }}>{listing.category}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>{listing.status}</span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                          {listing.status !== 'active' && (
                            <button onClick={() => handleStatusChange(listing._id, 'active')}
                              style={{ padding: '4px 9px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, color: '#4ADE80', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Activate</button>
                          )}
                          {listing.status === 'active' && (
                            <button onClick={() => handleStatusChange(listing._id, 'expired')}
                              style={{ padding: '4px 9px', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 6, color: '#94A3B8', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                          )}
                          <button onClick={() => handleDelete(listing._id)}
                            style={{ padding: '4px 9px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#F87171', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && listings.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: dk.subtle }}>No listings found</div>
            )}
          </div>

          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '8px 16px', background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 8, color: dk.text, cursor: 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit' }}>← Prev</button>
              <span style={{ padding: '8px 16px', color: dk.muted, fontSize: 14 }}>Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                style={{ padding: '8px 16px', background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 8, color: dk.text, cursor: 'pointer', opacity: page === pagination.pages ? 0.4 : 1, fontFamily: 'inherit' }}>Next →</button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ width: 300, flexShrink: 0, background: dk.card, borderRadius: 14, border: `1px solid ${dk.border}`, padding: 20, position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ color: dk.text, fontSize: 15, fontWeight: 700 }}>Listing Detail</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: dk.subtle, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            {selected.images?.[0]?.url && (
              <img src={selected.images[0].url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 14 }} />
            )}
            <p style={{ color: dk.text, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{selected.title}</p>
            <p style={{ color: dk.subtle, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{selected.description?.slice(0, 150)}{selected.description?.length > 150 ? '...' : ''}</p>
            {[
              ['Type', selected.type],
              ['Price', selected.type === 'sell' ? `₹${selected.price?.toLocaleString('en-IN')}` : '—'],
              ['Category', selected.category],
              ['Condition', selected.condition],
              ['Views', selected.views || 0],
              ['Saves', selected.savedBy?.length || 0],
              ['Seller', selected.seller?.name],
              ['Posted', new Date(selected.createdAt).toLocaleDateString()],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${dk.border}` }}>
                <span style={{ color: dk.subtle, fontSize: 12 }}>{k}</span>
                <span style={{ color: dk.muted, fontSize: 12, fontWeight: 500 }}>{String(v)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {selected.status !== 'active' && (
                <button onClick={() => handleStatusChange(selected._id, 'active')}
                  style={{ padding: '9px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#4ADE80', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Activate Listing</button>
              )}
              {selected.status === 'active' && (
                <button onClick={() => handleStatusChange(selected._id, 'expired')}
                  style={{ padding: '9px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 8, color: '#FACC15', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Remove from Active</button>
              )}
              <button onClick={() => handleDelete(selected._id)}
                style={{ padding: '9px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#F87171', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>🗑️ Delete Listing</button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </AdminLayout>
  );
}
