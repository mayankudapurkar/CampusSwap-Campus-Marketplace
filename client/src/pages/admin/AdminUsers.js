import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout';

const dk = { card: '#1E293B', border: '#334155', text: 'white', muted: '#94A3B8', subtle: '#64748B', input: '#0F172A' };

const adminAxios = () => axios.create({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verified, setVerified] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [userDetail, setUserDetail] = useState(null);
  const [actionLoading, setActionLoading] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, sort: '-createdAt' });
      if (search) params.set('search', search);
      if (verified !== 'all') params.set('verified', verified);
      const { data } = await adminAxios().get(`/api/admin/users?${params}`);
      setUsers(data.users);
      setPagination({ total: data.total, pages: data.pages, page: data.page });
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, [page, search, verified]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openDetail = async (user) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const { data } = await adminAxios().get(`/api/admin/users/${user._id}`);
      setUserDetail(data);
    } catch {} finally { setDetailLoading(false); }
  };

  const handleVerify = async (userId) => {
    setActionLoading(userId + 'verify');
    try {
      await adminAxios().patch(`/api/admin/users/${userId}/verify`);
      fetchUsers();
      if (userDetail) setUserDetail(prev => ({ ...prev, user: { ...prev.user, isVerified: true } }));
    } catch (err) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(''); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user and ALL their data? This cannot be undone.')) return;
    setActionLoading(userId + 'delete');
    try {
      await adminAxios().delete(`/api/admin/users/${userId}`);
      setSelectedUser(null);
      setUserDetail(null);
      fetchUsers();
    } catch (err) { alert(err?.response?.data?.message || 'Failed'); }
    finally { setActionLoading(''); }
  };

  const handleSuspend = async (userId) => {
    const reason = window.prompt('Reason for suspension (optional):');
    if (reason === null) return;
    setActionLoading(userId + 'suspend');
    try {
      await adminAxios().patch(`/api/admin/users/${userId}/suspend`, { reason });
      fetchUsers();
      setSelectedUser(null);
      setUserDetail(null);
    } catch (err) { alert(err?.response?.data?.message || 'Only super admins can suspend users'); }
    finally { setActionLoading(''); }
  };

  return (
    <AdminLayout title="User Management">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* User list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search name, email, college..."
              style={{ flex: 1, minWidth: 200, padding: '10px 14px', background: dk.input, border: `1px solid ${dk.border}`, borderRadius: 10, color: dk.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' }} />
            <select value={verified} onChange={e => { setVerified(e.target.value); setPage(1); }}
              style={{ padding: '10px 14px', background: dk.input, border: `1px solid ${dk.border}`, borderRadius: 10, color: dk.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
              <option value="all">All users</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ background: dk.card, borderRadius: 14, border: `1px solid ${dk.border}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${dk.border}` }}>
                  {['User', 'College', 'Joined', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', color: dk.subtle, fontSize: 12, fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? [...Array(8)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${dk.border}` }}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: 12, background: '#334155', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                      </td>
                    ))}
                  </tr>
                )) : users.map(user => (
                  <tr key={user._id} style={{ borderBottom: `1px solid ${dk.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => openDetail(user)}
                    onMouseEnter={e => e.currentTarget.style.background = '#263548'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#A78BFA', fontSize: 14, overflow: 'hidden', flexShrink: 0 }}>
                          {user.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name?.[0]}
                        </div>
                        <div>
                          <p style={{ color: dk.text, fontWeight: 600, fontSize: 14 }}>{user.name}</p>
                          <p style={{ color: dk.subtle, fontSize: 12 }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: dk.muted, fontSize: 13 }}>{user.college}</td>
                    <td style={{ padding: '12px 16px', color: dk.subtle, fontSize: 12 }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: user.isVerified ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)', color: user.isVerified ? '#4ADE80' : '#FACC15' }}>
                        {user.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        {!user.isVerified && (
                          <button onClick={() => handleVerify(user._id)} disabled={actionLoading === user._id + 'verify'}
                            style={{ padding: '5px 10px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 7, color: '#4ADE80', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            ✓ Verify
                          </button>
                        )}
                        <button onClick={() => handleDelete(user._id)} disabled={actionLoading === user._id + 'delete'}
                          style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, color: '#F87171', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && users.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: dk.subtle }}>No users found</div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '8px 16px', background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 8, color: dk.text, cursor: 'pointer', opacity: page === 1 ? 0.4 : 1, fontFamily: 'inherit' }}>
                ← Prev
              </button>
              <span style={{ padding: '8px 16px', color: dk.muted, fontSize: 14 }}>Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                style={{ padding: '8px 16px', background: dk.card, border: `1px solid ${dk.border}`, borderRadius: 8, color: dk.text, cursor: 'pointer', opacity: page === pagination.pages ? 0.4 : 1, fontFamily: 'inherit' }}>
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedUser && (
          <div style={{ width: 320, flexShrink: 0, background: dk.card, borderRadius: 14, border: `1px solid ${dk.border}`, padding: 20, position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ color: dk.text, fontSize: 16, fontWeight: 700 }}>User Detail</h3>
              <button onClick={() => { setSelectedUser(null); setUserDetail(null); }} style={{ background: 'none', border: 'none', color: dk.subtle, cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>

            {detailLoading ? (
              <div style={{ color: dk.subtle, fontSize: 14 }}>Loading...</div>
            ) : userDetail && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '12px 0', borderBottom: `1px solid ${dk.border}` }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#A78BFA', fontSize: 20, overflow: 'hidden', flexShrink: 0 }}>
                    {userDetail.user.avatar ? <img src={userDetail.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userDetail.user.name?.[0]}
                  </div>
                  <div>
                    <p style={{ color: dk.text, fontWeight: 700, fontSize: 15 }}>{userDetail.user.name}</p>
                    <p style={{ color: dk.subtle, fontSize: 12 }}>{userDetail.user.email}</p>
                  </div>
                </div>

                {[
                  ['College', userDetail.user.college],
                  ['Department', userDetail.user.department || '—'],
                  ['Year', userDetail.user.year || '—'],
                  ['Listings', userDetail.listings?.length],
                  ['Reviews', userDetail.reviews?.length],
                  ['Rating', `${userDetail.user.rating?.average?.toFixed(1) || '—'} (${userDetail.user.rating?.count || 0})`],
                  ['Sales', userDetail.user.totalSales || 0],
                  ['Joined', new Date(userDetail.user.createdAt).toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${dk.border}` }}>
                    <span style={{ color: dk.subtle, fontSize: 13 }}>{k}</span>
                    <span style={{ color: dk.muted, fontSize: 13, fontWeight: 500, textAlign: 'right', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(v)}</span>
                  </div>
                ))}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                  {!userDetail.user.isVerified && (
                    <button onClick={() => handleVerify(userDetail.user._id)}
                      style={{ padding: '9px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#4ADE80', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                      ✓ Verify Email
                    </button>
                  )}
                  <button onClick={() => handleSuspend(userDetail.user._id)}
                    style={{ padding: '9px', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 8, color: '#FACC15', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                    🚫 Suspend User
                  </button>
                  <button onClick={() => handleDelete(userDetail.user._id)}
                    style={{ padding: '9px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#F87171', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                    🗑️ Delete User
                  </button>
                </div>

                {/* Recent listings */}
                {userDetail.listings?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ color: dk.muted, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Recent Listings</p>
                    {userDetail.listings.slice(0, 4).map(l => (
                      <div key={l._id} style={{ padding: '8px 0', borderBottom: `1px solid ${dk.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: dk.muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{l.title}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, marginLeft: 8, flexShrink: 0, background: l.status === 'active' ? 'rgba(34,197,94,0.15)' : '#334155', color: l.status === 'active' ? '#4ADE80' : dk.subtle }}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </AdminLayout>
  );
}
