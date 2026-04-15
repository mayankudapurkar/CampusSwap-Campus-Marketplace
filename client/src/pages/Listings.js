import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/layout/Navbar';
import ListingCard from '../components/listings/ListingCard';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🏪' },
  { id: 'textbooks', label: 'Textbooks', emoji: '📚' },
  { id: 'notes', label: 'Notes', emoji: '📝' },
  { id: 'electronics', label: 'Electronics', emoji: '💻' },
  { id: 'lab-equipment', label: 'Lab Gear', emoji: '🔬' },
  { id: 'stationery', label: 'Stationery', emoji: '✏️' },
  { id: 'calculators', label: 'Calculators', emoji: '🔢' },
  { id: 'cycles', label: 'Cycles', emoji: '🚲' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'clothing', label: 'Clothing', emoji: '👕' },
  { id: 'furniture', label: 'Furniture', emoji: '🪑' },
  { id: 'other', label: 'Other', emoji: '📦' },
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: '-views', label: 'Most Viewed' },
];

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    type: 'all',
    condition: 'all',
    sort: '-createdAt',
    minPrice: '',
    maxPrice: '',
    search: searchParams.get('search') || ''
  });
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: searchParams.get('category') || 'all',
      search: searchParams.get('search') || ''
    }));
    setSearchInput(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, sort: filters.sort });
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.type !== 'all') params.set('type', filters.type);
      if (filters.condition !== 'all') params.set('condition', filters.condition);
      if (filters.search) params.set('search', filters.search);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);

      const { data } = await axios.get(`/api/listings?${params}`);
      setListings(data.listings);
      setPagination(data.pagination);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchListings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchListings]);

  const setFilter = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilter('search', searchInput);
  };

  const clearFilters = () => {
    setFilters({ category: 'all', type: 'all', condition: 'all', sort: '-createdAt', minPrice: '', maxPrice: '', search: '' });
    setSearchInput('');
    setPage(1);
    setSearchParams({});
  };

  const activeFilterCount = [
    filters.category !== 'all', filters.type !== 'all', filters.condition !== 'all',
    filters.minPrice, filters.maxPrice
  ].filter(Boolean).length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface2)' }}>
      <Navbar />

      {/* Search bar header */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearch} style={{ flex: 1, minWidth: 200, display: 'flex', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Search listings..." className="input"
                style={{ paddingLeft: 42, paddingRight: 80, borderRadius: 'var(--radius-lg)' }} />
              <button type="submit" className="btn btn-primary" style={{ position: 'absolute', right: 4, top: 4, bottom: 4, borderRadius: 10, padding: '0 14px', fontSize: 13 }}>
                Search
              </button>
            </form>

            <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}
              className="input" style={{ width: 180, flexShrink: 0, cursor: 'pointer' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="btn btn-secondary" style={{ flexShrink: 0, gap: 6 }}>
              🎛 Filters {activeFilterCount > 0 && <span className="badge">{activeFilterCount}</span>}
            </button>

            {user && (
              <Link to="/create-listing" className="btn btn-primary" style={{ flexShrink: 0 }}>
                + New Listing
              </Link>
            )}
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 12, paddingBottom: 4 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setFilter('category', cat.id)}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 100, border: '1.5px solid',
                  borderColor: filters.category === cat.id ? 'var(--primary)' : 'var(--border)',
                  background: filters.category === cat.id ? 'var(--primary)' : 'white',
                  color: filters.category === cat.id ? 'white' : 'var(--text2)',
                  fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'var(--transition)',
                  display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit'
                }}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '24px 20px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Sidebar filters */}
        {sidebarOpen && (
          <aside style={{ width: 260, flexShrink: 0, background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 20, position: 'sticky', top: 88 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Filters</h3>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear all</button>
              )}
            </div>

            <FilterSection title="Listing Type">
              {['all', 'sell', 'exchange', 'free'].map(t => (
                <FilterOption key={t} active={filters.type === t} onClick={() => setFilter('type', t)}
                  label={t === 'all' ? 'All Types' : t === 'sell' ? '💰 For Sale' : t === 'exchange' ? '⇄ Exchange' : '🎁 Free'} />
              ))}
            </FilterSection>

            <FilterSection title="Condition">
              {['all', 'new', 'like-new', 'good', 'fair', 'poor'].map(c => (
                <FilterOption key={c} active={filters.condition === c} onClick={() => setFilter('condition', c)}
                  label={c === 'all' ? 'Any Condition' : c.charAt(0).toUpperCase() + c.slice(1)} />
              ))}
            </FilterSection>

            <FilterSection title="Price Range">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)}
                  className="input" style={{ flex: 1, padding: '8px 10px', fontSize: 13 }} />
                <span style={{ color: 'var(--text3)', flexShrink: 0, fontSize: 13 }}>to</span>
                <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)}
                  className="input" style={{ flex: 1, padding: '8px 10px', fontSize: 13 }} />
              </div>
            </FilterSection>
          </aside>
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Results info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text3)', fontWeight: 500 }}>
              {loading ? 'Loading...' : `${pagination.total || 0} listing${pagination.total !== 1 ? 's' : ''} found`}
              {filters.search && ` for "${filters.search}"`}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} style={{ fontSize: 13, color: 'var(--secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>✕ Clear filters</button>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {[...Array(12)].map((_, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div className="skeleton" style={{ height: 170 }} />
                  <div style={{ padding: 16 }}>
                    <div className="skeleton" style={{ height: 14, borderRadius: 4, marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, borderRadius: 4, width: '70%', marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 12, borderRadius: 4, width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>No listings found</h3>
              <p style={{ color: 'var(--text3)', marginBottom: 24 }}>Try adjusting your filters or search term</p>
              <button onClick={clearFilters} className="btn btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                {listings.map((listing, i) => (
                  <div key={listing._id} style={{ animation: `fadeIn 0.3s ease ${i * 0.04}s both` }}>
                    <ListingCard listing={listing} onSaveToggle={fetchListings} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="btn btn-secondary" style={{ opacity: page === 1 ? 0.5 : 1 }}>← Prev</button>
                  {[...Array(Math.min(pagination.pages, 7))].map((_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className="btn" style={{ minWidth: 40, justifyContent: 'center', background: page === p ? 'var(--primary)' : 'white', color: page === p ? 'white' : 'var(--text)', border: '1.5px solid', borderColor: page === p ? 'var(--primary)' : 'var(--border)' }}>
                        {p}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                    className="btn btn-secondary" style={{ opacity: page === pagination.pages ? 0.5 : 1 }}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

function FilterOption({ active, onClick, label }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 12px', borderRadius: 8, border: '1.5px solid', textAlign: 'left',
      borderColor: active ? 'var(--primary)' : 'transparent',
      background: active ? 'var(--surface3)' : 'transparent',
      color: active ? 'var(--primary)' : 'var(--text2)',
      fontWeight: active ? 600 : 400, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'var(--transition)'
    }}>
      {active && '✓ '}{label}
    </button>
  );
}
