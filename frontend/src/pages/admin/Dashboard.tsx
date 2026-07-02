import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Megaphone,
  BookOpen,
  MapPin,
  Calendar,
  ShoppingBag,
  Briefcase,
  Bot,
  Clock,
  CheckCircle,
  Shield,
  GraduationCap,
  Users,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

interface AdminStats {
  studentCount: number;
  facultyCount: number;
  pendingFacultyCount: number;
  pendingMarketplaceCount: number;
  departmentCount: number;
}

const quickLinks = [
  { name: 'User Manager', path: '/admin/users', icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
  { name: 'Attendance', path: '/attendance', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
  { name: 'Announcements', path: '/announcements', icon: Megaphone, color: 'text-brand-500', bg: 'bg-brand-500/10 border-brand-500/20' },
  { name: 'Study Materials', path: '/notes', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  { name: 'Events', path: '/events', icon: Calendar, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
  { name: 'Marketplace', path: '/marketplace', icon: ShoppingBag, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  { name: 'Placement Hub', path: '/placements', icon: Briefcase, color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/20' },
  { name: 'Campus AI', path: '/ai-assistant', icon: Bot, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
  { name: 'Lost & Found', path: '/lost-found', icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
];

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err: any) {
        setError('Failed to fetch system metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 pb-6">
      {/* College Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600/80 via-brand-600/90 to-indigo-700/90 p-8 shadow-2xl shadow-rose-500/20 border border-white/10"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/20 blur-xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
            <img src="/college-logo.png" alt="FXEC Logo" className="w-16 h-16 object-contain" />
          </div>
          <div className="flex-grow">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
              Francis Xavier Engineering College
            </h2>
            <p className="text-white/70 text-sm font-semibold tracking-widest uppercase mt-1">
              An Autonomous Institution · FXEC
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 text-white px-3 py-1.5 rounded-full border border-white/20">
                <Shield className="w-3.5 h-3.5" />
                Administrator Console
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 text-white px-3 py-1.5 rounded-full border border-white/20">
                <Clock className="w-3.5 h-3.5" />
                {dateStr}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-green-400/20 text-green-300 px-3 py-1.5 rounded-full border border-green-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping inline-block" />
                Systems Operational
              </span>
            </div>
          </div>
        </div>
        <div className="relative mt-6 pt-5 border-t border-white/15">
          <p className="text-white/60 text-sm font-medium">{getGreeting()}, Admin</p>
          <p className="text-white text-xl font-bold mt-0.5">{user?.name} 👋</p>
        </div>
      </motion.div>

      {/* Pending Approvals Warning Banner */}
      {!loading && stats && stats.pendingFacultyCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-amber-500/10 border border-amber-500/25 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 animate-bounce" />
            <div>
              <h4 className="text-sm font-bold text-light-text dark:text-dark-text">Action Required: Pending Registration Approval</h4>
              <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                There are <span className="font-bold text-amber-500">{stats.pendingFacultyCount}</span> faculty account registrations awaiting administrator verification.
              </p>
            </div>
          </div>
          <Link
            to="/admin/users"
            className="w-full sm:w-auto text-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            Review Requests
          </Link>
        </motion.div>
      )}

      {/* KPI Cards Grid */}
      <div>
        <h3 className="text-base font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-4 px-1">System Metrics</h3>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 bg-light-card dark:bg-dark-card/50 rounded-2xl animate-pulse border border-light-border dark:border-dark-border/30" />
            ))}
          </div>
        ) : error || !stats ? (
          <div className="p-4 bg-red-500/10 border border-red-500/35 text-red-600 dark:text-red-400 rounded-xl text-xs">
            {error || 'Error loading dashboard statistics'}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Students */}
            <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-28">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Students</span>
                <GraduationCap className="w-5 h-5 text-brand-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.studentCount}</span>
                <span className="text-[10px] font-medium text-light-muted dark:text-dark-muted">enrolled</span>
              </div>
            </div>

            {/* Faculty */}
            <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-28">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Active Faculty</span>
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.facultyCount}</span>
                <span className="text-[10px] font-medium text-light-muted dark:text-dark-muted">approved</span>
              </div>
            </div>

            {/* Pending Faculty approvals */}
            <div className={`border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-28 ${
              stats.pendingFacultyCount > 0
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-white dark:bg-dark-card border-light-border dark:border-dark-border/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Pending Faculty</span>
                <AlertCircle className={`w-5 h-5 ${stats.pendingFacultyCount > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl font-extrabold leading-none ${stats.pendingFacultyCount > 0 ? 'text-amber-500' : 'text-light-text dark:text-dark-text'}`}>{stats.pendingFacultyCount}</span>
                <span className="text-[10px] font-medium text-light-muted dark:text-dark-muted">awaiting approval</span>
              </div>
            </div>

            {/* Pending Listings */}
            <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-28">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Pending Marketplace</span>
                <ShoppingBag className="w-5 h-5 text-purple-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.pendingMarketplaceCount}</span>
                <span className="text-[10px] font-medium text-light-muted dark:text-dark-muted">moderations</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Access */}
      <div>
        <h3 className="text-base font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-4 px-1">Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, i) => (
            <motion.div key={link.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={link.path} className={`group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border ${link.bg} hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${link.bg} ${link.color} border group-hover:scale-110 transition-transform duration-200`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-bold ${link.color} text-center leading-tight`}>{link.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-panel-light dark:glass-panel-dark rounded-2xl p-5 border border-light-border dark:border-dark-border/30">
          <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-1">Admin</p>
          <p className="text-base font-bold text-light-text dark:text-dark-text">{user?.name}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass-panel-light dark:glass-panel-dark rounded-2xl p-5 border border-light-border dark:border-dark-border/30">
          <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-1">System Status</p>
          <p className="text-base font-bold text-green-500">Active & Operational</p>
        </motion.div>
      </div>
    </div>
  );
};
export default AdminDashboard;
