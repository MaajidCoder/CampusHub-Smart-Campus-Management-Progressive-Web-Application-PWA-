import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface ProtectedLayoutProps {
  allowedRoles?: ('student' | 'faculty' | 'admin')[];
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg text-dark-text">
        <RefreshCw className="w-10 h-10 animate-spin text-brand-500 mb-4" />
        <p className="text-sm font-medium tracking-wide text-dark-muted">Verifying your secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // Save current path to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Beautiful Glassmorphic Unauthorized view
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg p-6 text-dark-text">
        <div className="max-w-md w-full glass-panel-dark p-8 rounded-2xl border border-red-500/20 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold font-sans tracking-tight mb-2">Access Restrictive</h2>
          <p className="text-dark-muted text-sm leading-relaxed mb-6">
            Your user credentials ({user.role}) do not grant permission to view this panel. If you believe this is in error, contact the CampusHub systems administrator.
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 px-4 bg-dark-border border border-dark-border hover:bg-dark-border/80 transition-all rounded-xl font-medium text-sm text-dark-text"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render child routes
  return <Outlet />;
};
