import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  QrCode,
  Megaphone,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FacultyStats {
  subjectsCount: number;
  totalStudents: number;
  eventsCount: number;
  checkinsCount: number;
}

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err: any) {
        setError('Failed to fetch faculty metrics.');
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
            Faculty workspace
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-light-text dark:text-dark-text tracking-tight leading-none">
            Welcome back, Prof. {user?.name.split(' ')[0]}! 🎓
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-2 leading-relaxed max-w-xl">
            Manage your courses, coordinate check-in geofences, publish announcements, or create campus fests fables. Use your workspace cards below to navigate quickly.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 flex-shrink-0">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      {/* Stats Widgets */}
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
          {/* Subjects Taught */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Courses Taught</span>
              <BookOpen className="w-4 h-4 text-brand-500" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.subjectsCount}</span>
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted">Active Classes</span>
            </div>
          </div>

          {/* Enrolled Students */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Total Students</span>
              <Users className="w-4 h-4 text-green-500" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.totalStudents}</span>
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted">Class Enrollments</span>
            </div>
          </div>

          {/* Hosted Events */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Hosted Events</span>
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.eventsCount}</span>
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted">Organized RSVPs</span>
            </div>
          </div>

          {/* Total Marked Check-ins */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider">Lectures Recorded</span>
              <CheckCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-end justify-between mt-4">
              <span className="text-3xl font-extrabold text-light-text dark:text-dark-text leading-none">{stats.checkinsCount}</span>
              <span className="text-[10px] font-bold text-light-muted dark:text-dark-muted">Attendance Check-ins</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Workspace */}
      <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30 max-w-4xl">
        <h3 className="text-sm font-bold text-light-text dark:text-dark-text mb-4">Workspace Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/attendance"
            className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/20 rounded-2xl hover:border-brand-500/30 transition-all flex flex-col items-center text-center group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold group-hover:text-brand-500 transition-colors">Start QR Check-in</h4>
            <p className="text-[9px] text-light-muted dark:text-dark-muted mt-1">Generate rotating classroom tokens</p>
          </Link>

          <Link
            to="/announcements"
            className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/20 rounded-2xl hover:border-brand-500/30 transition-all flex flex-col items-center text-center group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-3">
              <Megaphone className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold group-hover:text-green-500 transition-colors">Post Announcement</h4>
            <p className="text-[9px] text-light-muted dark:text-dark-muted mt-1">Broadcast notice warnings & updates</p>
          </Link>

          <Link
            to="/events"
            className="p-5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/20 rounded-2xl hover:border-brand-500/30 transition-all flex flex-col items-center text-center group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold group-hover:text-purple-500 transition-colors">Host Event</h4>
            <p className="text-[9px] text-light-muted dark:text-dark-muted mt-1">Publish campus seminars & workshops</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
export default FacultyDashboard;
