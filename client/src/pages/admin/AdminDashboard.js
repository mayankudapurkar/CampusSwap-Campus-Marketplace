import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/admin/AdminLayout';

const dark = { card: '#1E293B', border: '#334155', text: 'white', muted: '#94A3B8', subtle: '#64748B' };

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: dark.card, borderRadius: 14, padding: '20px 22px', border: `1px solid ${dark.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: dark.subtle, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{label}</p>
          <p style={{ color: dark.text, fontSize: 30, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>{value?.toLocaleString()}</p>
          {sub && <p style={{ color: color || '#6366F1', fontSize: 12, fontWeight: 600, marginTop: 6 }}>{sub}</p>}
        </div>
        <div style={{ fontSize: 28 }}>{icon}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    axios.get('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout title="Dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ height: 110, background: dark.card, borderRadius: 14, border: `1px solid ${dark.border}`, animation: 'pulse 1.5s infinite' }} />)}
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Dashboard">

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon="👥" label="Total Users" value={stats?.totalUsers} sub={`+${stats?.usersToday} today`} color="#22C55E" />
        <StatCard icon="✅" label="Verified Users" value={stats?.verifiedUsers} sub={`${stats?.totalUsers ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}% verified`} />
        <StatCard icon="📦" label="Total Listings" value={stats?.totalListings} sub={`+${stats?.listingsToday} today`} color="#22C55E" />
        <StatCard icon="🟢" label="Active Listings" value={stats?.activeListings} />
        <StatCard icon="✅" label="Sold Listings" value={stats?.soldListings} />
        <StatCard icon="💬" label="Total Messages" value={stats?.totalMessages} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Category breakdown */}
        <div style={{ background: dark.card, borderRadius: 16, padding: 24, border: `1px solid ${dark.border}` }}>
          <h3 style={{ color: dark.text, fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Listings by Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats?.categoryBreakdown?.slice(0, 8).map(({ _id, count }) => {
              const max = stats.categoryBreakdown[0]?.count || 1;
              const pct = Math.round((count / max) * 100);
              return (
                <div key={_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: dark.muted, fontSize: 13, fontWeight: 500 }}>{_id || 'other'}</span>
                    <span style={{ color: dark.text, fontSize: 13, fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: '#0F172A', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1, #8B5CF6)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity last 7 days */}
        <div style={{ background: dark.card, borderRadius: 16, padding: 24, border: `1px solid ${dark.border}` }}>
          <h3 style={{ color: dark.text, fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Listings — Last 7 Days</h3>
          {stats?.last7Days?.length === 0 ? (
            <p style={{ color: dark.subtle, fontSize: 14 }}>No listings in the last 7 days.</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {stats?.last7Days?.map(({ _id, count }) => {
                const maxCount = Math.max(...(stats.last7Days.map(d => d.count)), 1);
                const h = Math.max(8, (count / maxCount) * 100);
                return (
                  <div key={_id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: dark.muted, fontSize: 11, fontWeight: 600 }}>{count}</span>
                    <div style={{ width: '100%', height: `${h}%`, background: 'linear-gradient(180deg, #6366F1, #4F46E5)', borderRadius: '4px 4px 0 0', minHeight: 8 }} />
                    <span style={{ color: dark.subtle, fontSize: 10 }}>{_id?.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </AdminLayout>
  );
}
