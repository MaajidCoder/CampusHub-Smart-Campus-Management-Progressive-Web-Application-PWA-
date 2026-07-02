import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Users,
  GraduationCap,
  Shield,
  ShoppingBag,
  Database,
  Calendar,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminStats {
  studentCount: number;
  facultyCount: number;
  pendingMarketplaceCount: number;
  departmentCount: number;
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err: any) {
        setError('Failed to fetch admin metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel-light dark:glass-panel-dark p-6 md:p-8 rounded-3xl border border-light-border dark:border-dark-border/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-500 uppercase tracking-widest block mb-2">
            Administrator console
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-light-text dark:text-dark-text tracking-tight leading-none">
            Welcome back, System Admin {user?.name.split(' ')[0]}! 🛡️
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-2 leading-relaxed max-w-xl">
            You have full system privileges. Monitor user registration sizes, moderate marketplace classifieds, review evolve courses, and verify database integrity parameters.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 flex-shrink-0">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-light-card dark:bg-dark-card/50 rounded-3xl animate-pulse border border-light-border dark:border-dark-border/30" />
          ))}
        </div>
      ) : error || !stats ? (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error || 'Error loading dashboard metrics'}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {/* Registered Students */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Registered Students</span>
              <GraduationCap className="w-4 h-4 text-brand-500" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.studentCount}</span>
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted">Verified Students</span>
            </div>
          </div>

          {/* Active Faculty */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Active Faculty</span>
              <Users className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.facultyCount}</span>
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted">Verified Instructors</span>
            </div>
          </div>

          {/* Seeded Departments */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Seeded Majors</span>
              <Database className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.departmentCount}</span>
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted">Departments</span>
            </div>
          </div>

          {/* Pending Moderations */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Pending Moderation</span>
              <ShoppingBag className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.pendingMarketplaceCount}</span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 border rounded-lg ${
                stats.pendingMarketplaceCount > 0 ? 'text-amber-500 bg-amber-500/10 border-amber-500/25' : 'text-slate-500 bg-slate-500/10 border-slate-500/25'
              }`}>
                {stats.pendingMarketplaceCount > 0 ? 'Action Required' : 'Cleared'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel Shortcuts */}
      <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30 max-w-4xl">
        <h3 className="text-sm font-bold text-light-text dark:text-dark-text mb-4">Moderator Control Panel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/marketplace"
            className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/20 rounded-2xl hover:border-brand-500/30 transition-all flex flex-col items-center text-center group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold group-hover:text-amber-500 transition-colors">Marketplace approvals</h4>
            <p className="text-[9px] text-light-muted dark:text-dark-muted mt-1">Review pending textbookclassified listings</p>
          </Link>

          <Link
            to="/announcements"
            className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/20 rounded-2xl hover:border-brand-500/30 transition-all flex flex-col items-center text-center group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold group-hover:text-brand-500 transition-colors">Publish global alerts</h4>
            <p className="text-[9px] text-light-muted dark:text-dark-muted mt-1">Broadcast official notice summaries</p>
          </Link>

          <Link
            to="/lost-found"
            className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/20 rounded-2xl hover:border-brand-500/30 transition-all flex flex-col items-center text-center group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold group-hover:text-purple-500 transition-colors">Manage Lost & Found</h4>
            <p className="text-[9px] text-light-muted dark:text-dark-muted mt-1">Verify report listings & claims</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
