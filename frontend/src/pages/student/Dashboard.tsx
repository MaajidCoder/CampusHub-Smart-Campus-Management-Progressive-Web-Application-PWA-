import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Megaphone, BookOpen, MapPin, Calendar, ShoppingBag,
  Briefcase, Bot, GraduationCap, Clock, CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

const quickLinks = [
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

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 pb-6">

      {/* ── College Banner ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500/90 via-indigo-600/80 to-purple-700/90 p-8 shadow-2xl shadow-brand-500/20 border border-white/10"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/20 blur-xl" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* College Logo */}
          <div className="w-20 h-20 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
            <img
              src="/college-logo.png"
              alt="FXEC Logo"
              className="w-16 h-16 object-contain"
            />
          </div>

          {/* College Info */}
          <div className="flex-grow">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
              Francis Xavier Engineering College
            </h2>
            <p className="text-white/70 text-sm font-semibold tracking-widest uppercase mt-1">
              An Autonomous Institution · FXEC
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {user?.department?.name && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 text-white px-3 py-1.5 rounded-full border border-white/20">
                  <GraduationCap className="w-3.5 h-3.5" />
                  {user.department.name}{user?.semester ? ` · Semester ${user.semester}` : ''}
                </span>
              )}
              {!user?.department?.name && user?.semester && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 text-white px-3 py-1.5 rounded-full border border-white/20">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Semester {user.semester}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 text-white px-3 py-1.5 rounded-full border border-white/20">
                <Clock className="w-3.5 h-3.5" />
                {dateStr}
              </span>
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div className="relative mt-6 pt-5 border-t border-white/15">
          <p className="text-white/60 text-sm font-medium">{getGreeting()},</p>
          <p className="text-white text-xl font-bold mt-0.5">{user?.name} 👋</p>
        </div>
      </motion.div>

      {/* ── Quick Access Grid ─────────────────────── */}
      <div>
        <h3 className="text-base font-bold text-light-muted dark:text-dark-muted uppercase tracking-widest mb-4 px-1">
          Quick Access
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, i) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={link.path}
                className={`group flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border ${link.bg} hover:scale-105 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${link.bg} ${link.color} border group-hover:scale-110 transition-transform duration-200`}>
                  <link.icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-bold ${link.color} text-center leading-tight`}>
                  {link.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Info Cards Row ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel-light dark:glass-panel-dark rounded-2xl p-5 border border-light-border dark:border-dark-border/30"
        >
          <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-1">Student</p>
          <p className="text-base font-bold text-light-text dark:text-dark-text">{user?.name}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-panel-light dark:glass-panel-dark rounded-2xl p-5 border border-light-border dark:border-dark-border/30"
        >
          <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-1">Department</p>
          <p className="text-base font-bold text-light-text dark:text-dark-text">{user?.department?.name || '—'}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel-light dark:glass-panel-dark rounded-2xl p-5 border border-light-border dark:border-dark-border/30"
        >
          <p className="text-xs font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-1">Semester</p>
          <p className="text-base font-bold text-light-text dark:text-dark-text">
            {user?.semester ? `Semester ${user.semester}` : '—'}
          </p>
        </motion.div>
      </div>

    </div>
  );
};
export default StudentDashboard;
