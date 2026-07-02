import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  MapPin,
  Clock,
  Trash2,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader,
  Image as ImageIcon,
  Users,
  Check,
  CalendarDays
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  facultyOrganizer: {
    _id: string;
    name: string;
    avatar: string;
    email: string;
  };
  registrations: string[]; // array of student ids
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: string;
}

export const Events: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tab: 'browse' or 'organize' or 'my-rsvps'
  const [activeTab, setActiveTab] = useState<'browse' | 'organize' | 'my-rsvps'>('browse');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Image Upload File
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
    },
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/events';
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (activeTab === 'my-rsvps') params.append('registered', 'true');

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setEvents(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch campus events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchQuery, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setFileError('Only banner image files (JPEG, PNG, WEBP) are supported.');
        setSelectedFile(null);
      } else if (file.size > 5 * 1024 * 1024) {
        setFileError('Banner size must not exceed 5MB.');
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('date', data.date);
      formData.append('time', data.time);
      formData.append('location', data.location);
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      await api.post('/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Event published successfully!');
      reset();
      setSelectedFile(null);

      setTimeout(() => {
        setSuccess(null);
        setActiveTab('browse');
        fetchEvents();
      }, 1500);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRSVP = async (id: string, isRegistered: boolean) => {
    try {
      const endpoint = isRegistered ? `/events/${id}/unregister` : `/events/${id}/register`;
      const response = await api.post(endpoint);
      
      // Update local state with the returned updated event
      setEvents((prev) =>
        prev.map((ev) => (ev._id === id ? response.data.data : ev))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'RSVP operation failed.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Cancel and delete this event listing?')) return;
    try {
      await api.delete(`/events/${id}`);
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cancellation failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border/40 pb-4">
        <div>
          <p className="text-sm text-light-muted dark:text-dark-muted">
            Explore hackathons, guest lectures, cultural fests, and workshops.
          </p>
        </div>

        {/* Tab options */}
        <div className="flex bg-light-bg dark:bg-dark-bg/60 p-1 rounded-2xl border border-light-border dark:border-dark-border/40 self-start">
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'browse'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            Explore Events
          </button>
          
          {user?.role === 'student' && (
            <button
              onClick={() => setActiveTab('my-rsvps')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'my-rsvps'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
              }`}
            >
              My RSVPs
            </button>
          )}

          {(user?.role === 'faculty' || user?.role === 'admin') && (
            <button
              onClick={() => setActiveTab('organize')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'organize'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
              }`}
            >
              Host Event
            </button>
          )}
        </div>
      </div>

      {activeTab !== 'organize' ? (
        <>
          {/* Search bar */}
          <div className="relative max-w-md glass-panel-light dark:glass-panel-dark rounded-2xl p-2 border border-light-border dark:border-dark-border/30 flex items-center">
            <Search className="absolute left-4 text-light-muted dark:text-dark-muted w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event title, locations, key details..."
              className="w-full pl-9 pr-4 py-2 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl outline-none text-xs text-light-text dark:text-dark-text"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Grid display */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 bg-light-card dark:bg-dark-card/50 rounded-3xl animate-pulse border border-light-border dark:border-dark-border/30" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 bg-light-card dark:bg-dark-card/20 rounded-3xl border border-light-border dark:border-dark-border/30">
              <CalendarDays className="w-12 h-12 text-light-muted dark:text-dark-muted/40 mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Events Found</h3>
              <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
                There are no active events listed at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const isRegistered = user ? event.registrations.includes(user._id) : false;

                return (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-dark-card rounded-3xl border border-light-border dark:border-dark-border/30 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Image header */}
                      <div className="h-44 bg-light-bg dark:bg-dark-bg/60 border-b border-light-border dark:border-dark-border/30 relative flex items-center justify-center text-light-muted dark:text-dark-muted">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1.5 opacity-60">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-[10px] font-semibold">Campus Gathering</span>
                          </div>
                        )}

                        {/* Date overlay badge */}
                        <div className="absolute top-4 left-4 bg-white/90 dark:bg-dark-card/90 border border-light-border dark:border-dark-border/40 backdrop-blur-md px-3 py-1.5 rounded-2xl text-center shadow-md">
                          <p className="text-xs font-extrabold text-brand-500 leading-none">
                            {new Date(event.date).getDate()}
                          </p>
                          <p className="text-[8px] uppercase tracking-wider font-extrabold text-light-text dark:text-dark-text mt-0.5">
                            {new Date(event.date).toLocaleString('default', { month: 'short' })}
                          </p>
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-5">
                        <h4 className="text-base font-bold text-light-text dark:text-dark-text mb-2 line-clamp-1">
                          {event.title}
                        </h4>
                        <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed line-clamp-3 mb-4">
                          {event.description}
                        </p>

                        <div className="space-y-2 text-xs text-light-muted dark:text-dark-muted font-medium">
                          {event.time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-brand-500" />
                              <span>{event.time}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-brand-500" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-brand-500" />
                            <span>{event.registrations.length} Registrations</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-5 pt-3 border-t border-light-border dark:border-dark-border/20 flex items-center justify-between mt-4">
                      {/* Host */}
                      <div className="flex items-center gap-2">
                        <img
                          src={event.facultyOrganizer.avatar || 'https://res.cloudinary.com/dummy/image/upload/v1/campushub/avatars/default.png'}
                          alt={event.facultyOrganizer.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-[10px] font-semibold text-light-muted dark:text-dark-muted truncate max-w-[80px]">
                          {event.facultyOrganizer.name}
                        </span>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5">
                        {/* Organizer / Admin deletes */}
                        {(event.facultyOrganizer._id === user?._id || user?.role === 'admin') && (
                          <button
                            onClick={() => handleDelete(event._id)}
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            title="Cancel Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Student RSVP */}
                        {user?.role === 'student' && (
                          <button
                            onClick={() => handleRSVP(event._id, isRegistered)}
                            className={`py-1.5 px-3.5 rounded-xl text-[10px] font-bold transition-all shadow-md ${
                              isRegistered
                                ? 'bg-green-500 text-white shadow-green-500/10 hover:bg-green-600'
                                : 'bg-brand-500 text-white shadow-brand-500/15 hover:bg-brand-600'
                            }`}
                          >
                            {isRegistered ? (
                              <span className="flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Registered
                              </span>
                            ) : (
                              'Join RSVP'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Host Event creation form */
        <div className="max-w-xl mx-auto glass-panel-light dark:glass-panel-dark rounded-3xl p-8 border border-light-border dark:border-dark-border/30 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-500" />
            <span>Publish Campus Event</span>
          </h3>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl mb-6 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl mb-6 text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Event Title
              </label>
              <input
                type="text"
                {...register('title', { required: 'Event title is required' })}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                placeholder="e.g. Annual Technical Hackathon 2026"
              />
              {errors.title && (
                <span className="text-xs text-red-500 mt-1 block">{errors.title.message}</span>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Event Description
              </label>
              <textarea
                rows={4}
                {...register('description', { required: 'Event description is required' })}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text resize-none"
                placeholder="Details about prize pools, guest speaker summaries, schedules, eligibility rules..."
              />
              {errors.description && (
                <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Event Date
                </label>
                <input
                  type="date"
                  {...register('date', { required: 'Event date is required' })}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                />
                {errors.date && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.date.message}</span>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Event Time (Optional)
                </label>
                <input
                  type="text"
                  {...register('time')}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                  placeholder="e.g. 10:00 AM - 4:00 PM"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Event Location / Auditorium
              </label>
              <input
                type="text"
                {...register('location', { required: 'Event location is required' })}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                placeholder="e.g. Main Seminar Hall / Indoor Stadium"
              />
              {errors.location && (
                <span className="text-xs text-red-500 mt-1 block">{errors.location.message}</span>
              )}
            </div>

            {/* Banner file upload */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Banner Cover Photo (Optional, Max 5MB)
              </label>
              <div className="relative border-2 border-dashed border-light-border dark:border-dark-border/50 rounded-2xl p-6 flex flex-col items-center justify-center bg-light-bg/50 dark:bg-dark-bg/30">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <ImageIcon className="w-8 h-8 text-light-muted dark:text-dark-muted/50 mb-2" />
                {selectedFile ? (
                  <span className="text-xs font-bold text-brand-500 truncate max-w-[250px]">
                    {selectedFile.name}
                  </span>
                ) : (
                  <span className="text-xs text-light-muted dark:text-dark-muted text-center leading-normal">
                    Select event flyer or landscape background image
                  </span>
                )}
              </div>
              {fileError && <span className="text-xs text-red-500 mt-1 block">{fileError}</span>}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-light-border dark:border-dark-border/20">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setSelectedFile(null);
                  setActiveTab('browse');
                }}
                className="py-3 px-5 bg-light-bg dark:bg-dark-bg/60 hover:bg-light-border dark:hover:bg-dark-border/50 border border-light-border dark:border-dark-border/40 rounded-2xl font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="py-3 px-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/15 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <span>Publish Event</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default Events;
