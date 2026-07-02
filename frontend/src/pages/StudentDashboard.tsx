import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Calendar,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  BookOpen,
  QrCode,
  Bot,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Announcement {
  _id: string;
  title: string;
  category: string;
  createdAt: string;
}

interface StudentStats {
  attendanceRate: number;
  marketplaceCount: number;
  eventCount: number;
  recentAnnouncements: Announcement[];
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err: any) {
        setError('Failed to fetch dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getAttendanceColor = (rate: number) => {
    if (rate >= 75) return 'text-green-500 bg-green-500/10 border-green-500/25';
    if (rate >= 65) return 'text-amber-500 bg-amber-500/10 border-amber-500/25';
    return 'text-red-500 bg-red-500/10 border-red-500/25';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel-light dark:glass-panel-dark p-6 md:p-8 rounded-3xl border border-light-border dark:border-dark-border/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-500 uppercase tracking-widest block mb-2">
            Student workspace
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-light-text dark:text-dark-text tracking-tight leading-none">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-2 leading-relaxed max-w-xl">
            You are enrolled in **{user?.department?.name || 'CSE'}** (Semester {user?.semester || '1'}). Use your shortcuts below to log attendance, browse textbook classifieds, or consult your AI Advisor.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 flex-shrink-0">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-light-card dark:bg-dark-card/50 rounded-3xl animate-pulse border border-light-border dark:border-dark-border/30" />
          ))}
        </div>
      ) : error || !stats ? (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error || 'Error loading dashboard metrics'}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Average Attendance rate */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Average Attendance</span>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.attendanceRate}%</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-lg ${getAttendanceColor(stats.attendanceRate)}`}>
                {stats.attendanceRate >= 75 ? 'Cleared' : 'Warning'}
              </span>
            </div>
          </div>

          {/* Joined RSVPs */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Joined Events</span>
              <Calendar className="w-4 h-4 text-brand-500" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.eventCount}</span>
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted">Registered RSVPs</span>
            </div>
          </div>

          {/* Marketplace Listings */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Marketplace Items</span>
              <ShoppingBag className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.marketplaceCount}</span>
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted">Listed Listings</span>
            </div>
          </div>
        </div>
      )}

      {/* Main content columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30">
            <h3 className="text-sm font-bold text-light-text dark:text-dark-text mb-4">Quick Navigation Portal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/attendance"
                className="p-4 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/20 rounded-2xl hover:border-brand-500/30 transition-all flex items-center gap-3.5 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold group-hover:text-brand-500 transition-colors">Check Attendance</h4>
                  <p className="text-[9px] text-light-muted dark:text-dark-muted mt-0.5">Scan classroom QR geofences</p>
                </div>
              </Link>

              <Link
                to="/notes"
                className="p-4 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/20 rounded-2xl hover:border-brand-500/30 transition-all flex items-center gap-3.5 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold group-hover:text-green-500 transition-colors">Study Material Vault</h4>
                  <p className="text-[9px] text-light-muted dark:text-dark-muted mt-0.5">Download syllabus notes & PDFs</p>
                </div>
              </Link>

              <Link
                to="/ai-assistant"
                className="p-4 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/20 rounded-2xl hover:border-brand-500/30 transition-all flex items-center gap-3.5 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold group-hover:text-purple-500 transition-colors">Consult AI Advisor</h4>
                  <p className="text-[9px] text-light-muted dark:text-dark-muted mt-0.5">Ask questions about policies</p>
                </div>
              </Link>

              <Link
                to="/marketplace"
                className="p-4 bg-white dark:bg-dark-card border border-light-border border-light-border/20 rounded-2xl hover:border-brand-500/30 transition-all flex items-center gap-3.5 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold group-hover:text-amber-500 transition-colors">Sell Old Items</h4>
                  <p className="text-[9px] text-light-muted dark:text-dark-muted mt-0.5">List textbooks & calculators</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right column: Recent Announcements Preview */}
        <div className="space-y-6">
          <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-light-text dark:text-dark-text">Recent Announcements</h3>
              <Link to="/announcements" className="text-[10px] text-brand-500 font-bold hover:underline flex items-center gap-0.5">
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-14 bg-light-bg dark:bg-dark-bg/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : !stats || stats.recentAnnouncements.length === 0 ? (
              <p className="text-center py-6 text-xs text-light-muted dark:text-dark-muted">No recent announcements</p>
            ) : (
              <div className="space-y-3">
                {stats.recentAnnouncements.map((ann) => (
                  <Link
                    key={ann._id}
                    to="/announcements"
                    className="block p-3 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/20 hover:border-brand-500/25 rounded-2xl transition-all shadow-sm"
                  >
                    <span className="text-[9px] font-bold text-brand-500 uppercase tracking-wide">
                      {ann.category}
                    </span>
                    <h4 className="text-[11px] font-bold text-light-text dark:text-dark-text mt-0.5 truncate leading-tight">
                      {ann.title}
                    </h4>
                    <span className="text-[8px] text-light-muted dark:text-dark-muted block mt-1">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentDashboard;
