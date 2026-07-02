import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, User, Mail, Phone, BookOpen, GraduationCap, Save, Loader, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

// Generates a clean background color from a string (name)
const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-brand-500', 'bg-purple-500', 'bg-indigo-500',
    'bg-blue-500', 'bg-teal-500', 'bg-green-500',
    'bg-amber-500', 'bg-orange-500', 'bg-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const hasAvatar = (avatar?: string | null): boolean => {
  if (!avatar) return false;
  if (avatar.includes('res.cloudinary.com/dummy')) return false;
  return true;
};

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    hasAvatar(user?.avatar) ? user!.avatar! : null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const formData: any = { name, phone };

      // If a new avatar was selected, upload via FormData
      if (avatarFile) {
        const fd = new FormData();
        fd.append('name', name);
        if (phone) fd.append('phone', phone);
        fd.append('avatar', avatarFile);
        await updateProfile(fd);
      } else {
        await updateProfile(formData);
      }

      setSuccess('Profile updated successfully!');
      setAvatarFile(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const avatarBgColor = getAvatarColor(user?.name || 'User');
  const initials = getInitials(user?.name || 'U');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-light-text dark:text-dark-text tracking-tight">My Profile</h2>
        <p className="text-sm text-light-muted dark:text-dark-muted mt-1">Manage your personal information and account settings.</p>
      </div>

      {/* Avatar Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar display */}
          <div className="relative group flex-shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-brand-500/30 shadow-lg"
              />
            ) : (
              <div
                className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-lg ${avatarBgColor}`}
              >
                {initials}
              </div>
            )}
            {/* Camera overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-light-text dark:text-dark-text">{user?.name}</h3>
            <p className="text-sm text-light-muted dark:text-dark-muted mt-1">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-500/10 text-brand-500 px-3 py-1 rounded-full capitalize">
                <Shield className="w-3.5 h-3.5" />
                {user?.role}
              </span>
              {user?.isApproved && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-500/10 text-green-500 px-3 py-1 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approved
                </span>
              )}
            </div>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-2">
              Click the avatar to upload a new photo (max 5MB)
            </p>
          </div>
        </div>
      </motion.div>

      {/* Edit Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm"
      >
        <h4 className="text-base font-bold text-light-text dark:text-dark-text mb-5">Edit Information</h4>

        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl mb-5 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl mb-5 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted mb-2">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-base text-light-text dark:text-dark-text transition-all"
                placeholder="Your full name"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full pl-12 pr-4 py-3.5 bg-light-bg dark:bg-dark-bg/30 border border-light-border dark:border-dark-border/20 rounded-2xl outline-none text-base text-light-muted dark:text-dark-muted cursor-not-allowed opacity-70"
              />
            </div>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-1.5">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted mb-2">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-base text-light-text dark:text-dark-text transition-all"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Department & Semester (read-only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted mb-2">Department</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                  <BookOpen className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={user?.department ? `${user.department.name} (${user.department.code})` : 'Not assigned'}
                  disabled
                  className="w-full pl-12 pr-4 py-3.5 bg-light-bg dark:bg-dark-bg/30 border border-light-border dark:border-dark-border/20 rounded-2xl outline-none text-base text-light-muted dark:text-dark-muted cursor-not-allowed opacity-70"
                />
              </div>
            </div>

            {user?.role === 'student' && (
              <div>
                <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted mb-2">Semester</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={user?.semester ? `Semester ${user.semester}` : 'Not assigned'}
                    disabled
                    className="w-full pl-12 pr-4 py-3.5 bg-light-bg dark:bg-dark-bg/30 border border-light-border dark:border-dark-border/20 rounded-2xl outline-none text-base text-light-muted dark:text-dark-muted cursor-not-allowed opacity-70"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl text-base font-semibold flex items-center justify-center gap-2.5 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Saving changes...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;
