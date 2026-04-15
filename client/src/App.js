import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import './styles/global.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import MyListings from './pages/MyListings';
import SavedListings  from './pages/SavedListings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminListings from './pages/admin/AdminListings';
import AdminAccounts from './pages/admin/AdminAccounts';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--surface2)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text3)', fontWeight: 600 }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/listings" element={<Listings />} />
    <Route path="/listings/:id" element={<ListingDetail />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/verify-email/:token" element={<VerifyEmail />} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
    <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />
    <Route path="/create-listing" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
    <Route path="/edit-listing/:id" element={<ProtectedRoute><EditListing /></ProtectedRoute>} />
    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/profile/:id" element={<Profile />} />
    <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
    <Route path="/saved" element={<ProtectedRoute><SavedListings /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
    <Route path="/admin/login" element={<AdminLogin />} />
<Route path="/admin/dashboard" element={<AdminDashboard />} />
<Route path="/admin/users" element={<AdminUsers />} />
<Route path="/admin/listings" element={<AdminListings />} />
<Route path="/admin/admins" element={<AdminAccounts />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: 500,
                fontSize: '14px',
                boxShadow: '0 4px 20px rgba(91,74,232,0.15)',
                border: '1px solid rgba(91,74,232,0.1)'
              },
              success: { iconTheme: { primary: '#6BCB77', secondary: 'white' } },
              error: { iconTheme: { primary: '#FF6B6B', secondary: 'white' } }
            }}
          />
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
