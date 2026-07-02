import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Search,
  Trash2,
  Users,
  ShieldAlert,
  GraduationCap,
  Building,
  Loader2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  department?: Department;
  semester?: number;
  phone?: string;
  isApproved: boolean;
  createdAt: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'faculty' | 'student'>('all');
  
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/auth/users');
      setUsers(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      setActionLoadingId(userId);
      await api.patch(`/auth/users/${userId}/approve`);
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, isApproved: true } : u))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      setActionLoadingId(userId);
      await api.delete(`/auth/users/${userId}`);
      
      // Update local state
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setDeleteConfirmUser(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Deletion failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Avatar helper
  const getAvatarColor = (name: string): string => {
    const colors = [
      'bg-brand-500', 'bg-purple-500', 'bg-indigo-500',
      'bg-blue-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string): string =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  // Filter users based on query and tab selection
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department?.name && u.department.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'pending') {
      return u.role === 'faculty' && !u.isApproved;
    }
    if (activeTab === 'faculty') {
      return u.role === 'faculty';
    }
    if (activeTab === 'student') {
      return u.role === 'student';
    }
    return true;
  });

  const pendingCount = users.filter((u) => u.role === 'faculty' && !u.isApproved).length;

  return (
    <div className="space-y-8 pb-6">
      {/* Welcome Banner */}
      <div className="glass-panel-light dark:glass-panel-dark p-6 md:p-8 rounded-3xl border border-light-border dark:border-dark-border/30 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-500 uppercase tracking-widest block mb-2">
            Administrator console
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-light-text dark:text-dark-text tracking-tight leading-none">
            User Management Console 🛡️
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-2 leading-relaxed max-w-xl">
            Manage permissions, approve pending instructor signups, and monitor active system user registries.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="glass-panel-light dark:glass-panel-dark rounded-3xl border border-light-border dark:border-dark-border/30 p-6 shadow-sm space-y-6">
        
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-light-border dark:border-dark-border/20 pb-1 md:pb-0 md:border-none">
            {(['all', 'pending', 'faculty', 'student'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === tab
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10'
                    : 'text-light-muted dark:text-dark-muted hover:bg-light-bg dark:hover:bg-dark-bg/40'
                }`}
              >
                {tab === 'all' && 'All Users'}
                {tab === 'pending' && `Pending Faculty (${pendingCount})`}
                {tab === 'faculty' && 'Faculty'}
                {tab === 'student' && 'Students'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-light-muted dark:text-dark-muted">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name, email, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border/20 bg-light-bg dark:bg-dark-bg/30 text-light-text dark:text-dark-text focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>

        {/* User List Table / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-xs text-light-muted dark:text-dark-muted">Loading user database...</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-xs">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-light-border dark:border-dark-border/25 rounded-2xl">
            <Users className="w-8 h-8 mx-auto text-light-muted dark:text-dark-muted opacity-50 mb-3" />
            <h4 className="text-sm font-bold text-light-text dark:text-dark-text">No Users Found</h4>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
              {searchQuery ? 'Try adjusting your search filters.' : 'There are no active users matching this role.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-light-border dark:border-dark-border/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-light-bg/50 dark:bg-dark-bg/25 border-b border-light-border dark:border-dark-border/10 text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                  <th className="py-4 px-5">User</th>
                  <th className="py-4 px-5">Role</th>
                  <th className="py-4 px-5">Department</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border/10 text-xs text-light-text dark:text-dark-text">
                {filteredUsers.map((user) => {
                  const avatarBg = getAvatarColor(user.name);
                  const initials = getInitials(user.name);

                  return (
                    <tr key={user._id} className="hover:bg-light-bg/20 dark:hover:bg-dark-bg/10 transition-colors">
                      {/* Name / Email */}
                      <td className="py-4 px-5 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarBg}`}>
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold">{user.name}</p>
                          <p className="text-[10px] text-light-muted dark:text-dark-muted mt-0.5">{user.email}</p>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold ${
                          user.role === 'faculty'
                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
                            : 'bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-400'
                        }`}>
                          {user.role === 'faculty' ? (
                            <>
                              <Building className="w-3 h-3" />
                              Faculty
                            </>
                          ) : (
                            <>
                              <GraduationCap className="w-3 h-3" />
                              Student
                            </>
                          )}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-5">
                        {user.department ? (
                          <div>
                            <p className="font-semibold">{user.department.name}</p>
                            <p className="text-[9px] text-light-muted dark:text-dark-muted mt-0.5">Code: {user.department.code}</p>
                          </div>
                        ) : (
                          <span className="text-light-muted dark:text-dark-muted italic">Not Assigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {user.role === 'faculty' ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            user.isApproved
                              ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isApproved ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                            {user.isApproved ? 'Approved' : 'Pending Approval'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Approved
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approve Button (Faculty Only) */}
                          {user.role === 'faculty' && !user.isApproved && (
                            <button
                              onClick={() => handleApprove(user._id)}
                              disabled={actionLoadingId !== null}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-bold text-[10px] rounded-xl shadow-md transition-colors"
                            >
                              {actionLoadingId === user._id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserCheck className="w-3 h-3" />
                              )}
                              Approve
                            </button>
                          )}

                          {/* Delete Account */}
                          <button
                            onClick={() => setDeleteConfirmUser(user)}
                            disabled={actionLoadingId !== null}
                            className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border/40 p-6 rounded-3xl max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-light-text dark:text-dark-text">Permanently Delete User Account?</h4>
                  <p className="text-xs text-light-muted dark:text-dark-muted mt-1 leading-relaxed">
                    This action will permanently delete <span className="font-bold text-light-text dark:text-dark-text">{deleteConfirmUser.name}</span>'s account. This user will lose access to the system.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmUser(null)}
                  disabled={actionLoadingId !== null}
                  className="px-4 py-2 bg-light-bg dark:bg-dark-bg hover:bg-light-border/40 dark:hover:bg-dark-border/30 text-light-muted dark:text-dark-muted font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmUser._id)}
                  disabled={actionLoadingId !== null}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  {actionLoadingId === deleteConfirmUser._id && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
