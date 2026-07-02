import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Megaphone,
  Pin,
  Calendar,
  Trash2,
  Plus,
  X,
  AlertCircle,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  category: 'general' | 'academic' | 'exam' | 'event' | 'placement';
  author: {
    _id: string;
    name: string;
    role: string;
    avatar: string;
  };
  department?: Department;
  isPinned: boolean;
  createdAt: string;
}

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filtering states
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterDeptOnly, setFilterDeptOnly] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      content: '',
      category: 'general',
      department: '',
      isPinned: false,
    },
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string
      let url = '/announcements';
      const params = new URLSearchParams();
      if (filterCategory) params.append('category', filterCategory);
      if (filterDeptOnly && user?.department?._id) {
        params.append('department', user.department._id);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setAnnouncements(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not fetch announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [filterCategory, filterDeptOnly]);

  // Fetch departments when modal opens
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const response = await api.get('/departments');
        setDepartments(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch departments');
      }
    };
    if (showModal) {
      fetchDepts();
    }
  }, [showModal]);

  const onSubmit = async (data: any) => {
    try {
      setError(null);
      await api.post('/announcements', {
        ...data,
        department: data.department || undefined,
      });
      setShowModal(false);
      reset();
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit announcement.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Deletion failed.');
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'academic':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'exam':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'event':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'placement':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-light-muted dark:text-dark-muted">
            Stay updated with official notes, examinations, and events.
          </p>
        </div>

        {/* Post Button for Faculty & Admin */}
        {(user?.role === 'faculty' || user?.role === 'admin') && (
          <button
            onClick={() => setShowModal(true)}
            className="self-start sm:self-auto inline-flex items-center gap-2 py-3 px-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/15"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      {/* Filter and Control Bar */}
      <div className="glass-panel-light dark:glass-panel-dark rounded-2xl p-4 border border-light-border dark:border-dark-border/30 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-light-muted dark:text-dark-muted">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        <div className="flex flex-wrap gap-3 items-center flex-grow sm:flex-grow-0">
          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 rounded-xl text-xs outline-none text-light-text dark:text-dark-text focus:border-brand-500"
          >
            <option value="">All Categories</option>
            <option value="general">General</option>
            <option value="academic">Academic</option>
            <option value="exam">Examinations</option>
            <option value="event">Campus Events</option>
            <option value="placement">Placements</option>
          </select>

          {/* Department filter toggle */}
          {user?.department && (
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none text-light-text dark:text-dark-text">
              <input
                type="checkbox"
                checked={filterDeptOnly}
                onChange={(e) => setFilterDeptOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-500 border-light-border dark:border-dark-border/50 bg-light-bg dark:bg-dark-bg/60"
              />
              <span>My Department ({user.department.code}) Only</span>
            </label>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-light-card dark:bg-dark-card/50 rounded-3xl animate-pulse border border-light-border dark:border-dark-border/30" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-light-card dark:bg-dark-card/20 rounded-3xl border border-light-border dark:border-dark-border/30">
          <Megaphone className="w-12 h-12 text-light-muted dark:text-dark-muted/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold">No Announcements</h3>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
            There are no announcements matching your filters.
          </p>
        </div>
      ) : (
        /* Announcement Timeline feed */
        <div className="space-y-5">
          {announcements.map((ann) => (
            <motion.div
              key={ann._id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-3xl p-6 transition-all border ${
                ann.isPinned
                  ? 'bg-gradient-to-br from-brand-500/5 via-white/80 to-white border-brand-500/30 dark:from-brand-500/10 dark:via-dark-card/80 dark:to-dark-card shadow-lg shadow-brand-500/5'
                  : 'bg-white dark:bg-dark-card border-light-border dark:border-dark-border/30 shadow-sm'
              }`}
            >
              {/* Pin Indicator */}
              {ann.isPinned && (
                <div className="absolute top-6 right-6 flex items-center gap-1 text-[10px] font-bold text-brand-500 uppercase tracking-widest bg-brand-500/10 px-2 py-0.5 rounded-full">
                  <Pin className="w-3 h-3 rotate-45" />
                  <span>Pinned</span>
                </div>
              )}

              {/* Category & Title */}
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 border rounded-full ${getCategoryBadgeClass(ann.category)}`}>
                  {ann.category}
                </span>
                {ann.department && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 text-light-muted dark:text-dark-muted">
                    {ann.department.code} Department
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-3 leading-snug">
                {ann.title}
              </h3>

              <p className="text-sm text-light-muted dark:text-dark-muted leading-relaxed whitespace-pre-line mb-4">
                {ann.content}
              </p>

              {/* Footer Details */}
              <div className="flex items-center justify-between border-t border-light-border dark:border-dark-border/20 pt-4 text-xs text-light-muted dark:text-dark-muted">
                <div className="flex items-center gap-4">
                  {/* Author Profile */}
                  <div className="flex items-center gap-2">
                    <img
                      src={ann.author.avatar || 'https://res.cloudinary.com/dummy/image/upload/v1/campushub/avatars/default.png'}
                      alt={ann.author.name}
                      className="w-6 h-6 rounded-full object-cover bg-light-border dark:bg-dark-border"
                    />
                    <span className="font-semibold text-light-text dark:text-dark-text">
                      {ann.author.name}
                    </span>
                    <span className="text-[10px] capitalize bg-light-border dark:bg-dark-border px-1.5 py-0.5 rounded">
                      {ann.author.role}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Delete Button */}
                {(ann.author._id === user?._id || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDelete(ann._id)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Creation Modal for Faculty/Admin */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl border border-light-border dark:border-dark-border/40 p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-brand-500" />
                  <span>Create Announcement</span>
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg/60 rounded-xl text-light-muted dark:text-dark-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Creation Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Title is required' })}
                    className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                    placeholder="e.g. End Semester Exam Timetable"
                  />
                  {errors.title && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.title.message}</span>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                    Detailed Content
                  </label>
                  <textarea
                    rows={4}
                    {...register('content', { required: 'Content description is required' })}
                    className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text resize-none"
                    placeholder="Write detailed campus notification rules or instructions here..."
                  />
                  {errors.content && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.content.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <select
                      {...register('category')}
                      className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                    >
                      <option value="general">General</option>
                      <option value="academic">Academic</option>
                      <option value="exam">Examinations</option>
                      <option value="event">Campus Events</option>
                      <option value="placement">Placements</option>
                    </select>
                  </div>

                  {/* Targeted Department */}
                  <div>
                    <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                      Target Department (Optional)
                    </label>
                    <select
                      {...register('department')}
                      className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                    >
                      <option value="">Broadcast (All Departments)</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pinned checkbox - ONLY allowed for Faculty and Admin */}
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    id="isPinned"
                    {...register('isPinned')}
                    className="w-4 h-4 rounded text-brand-500 border-light-border dark:border-dark-border/50 bg-light-bg dark:bg-dark-bg/60 focus:ring-brand-500"
                  />
                  <label htmlFor="isPinned" className="text-sm font-semibold select-none cursor-pointer flex items-center gap-1.5 text-light-text dark:text-dark-text">
                    <Pin className="w-3.5 h-3.5 rotate-45 text-brand-500" />
                    <span>Pin this announcement at the top of the feed</span>
                  </label>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-light-border dark:border-dark-border/20">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="py-3 px-5 bg-light-bg dark:bg-dark-bg/60 hover:bg-light-border dark:hover:bg-dark-border/50 border border-light-border dark:border-dark-border/40 rounded-2xl font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/15"
                  >
                    Publish Post
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Announcements;
