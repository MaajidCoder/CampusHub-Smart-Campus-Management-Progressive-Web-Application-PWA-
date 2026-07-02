import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedLayout } from './layouts/ProtectedLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import StudentDashboard from './pages/student/Dashboard';
import FacultyDashboard from './pages/faculty/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import Announcements from './pages/Announcements';
import StudyMaterials from './pages/StudyMaterials';
import LostFound from './pages/LostFound';
import Attendance from './pages/Attendance';
import Events from './pages/Events';
import Marketplace from './pages/Marketplace';
import Placements from './pages/Placements';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';

// Helper component to redirect root URL to correct dashboard based on role
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg text-dark-text">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user.role === 'faculty') {
    return <Navigate to="/faculty/dashboard" replace />;
  } else {
    return <Navigate to="/student/dashboard" replace />;
  }
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text font-sans">
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Core Protected Routes - Nested inside Dashboard Shell Layout */}
            <Route element={<ProtectedLayout allowedRoles={['student', 'faculty', 'admin']} />}>
              <Route element={<DashboardLayout />}>
                {/* Shared utilities */}
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/notes" element={<StudyMaterials />} />
                <Route path="/lost-found" element={<LostFound />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/events" element={<Events />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/placements" element={<Placements />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
                <Route path="/profile" element={<Profile />} />

                {/* Role specific dashboard views inside layout */}
                <Route element={<ProtectedLayout allowedRoles={['student']} />}>
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                </Route>
                <Route element={<ProtectedLayout allowedRoles={['faculty']} />}>
                  <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                </Route>
                <Route element={<ProtectedLayout allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<UserManagement />} />
                </Route>
              </Route>
            </Route>

            {/* Root URL handler */}
            <Route path="/" element={<RootRedirect />} />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
