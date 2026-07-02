import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  MapPin,
  Calendar,
  Phone,
  Trash2,
  CheckCircle,
  Plus,
  Search,
  X,
  AlertCircle,
  Loader,
  Image as ImageIcon,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Item {
  _id: string;
  title: string;
  description: string;
  status: 'lost' | 'found' | 'claimed';
  location?: string;
  dateLostFound?: string;
  imageUrl?: string;
  imagePublicId?: string;
  contactDetails: string;
  reportedBy: {
    _id: string;
    name: string;
    role: string;
    avatar: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
}

export const LostFound: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Active detail modal
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Upload attachment file
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
      status: 'lost',
      location: '',
      dateLostFound: new Date().toISOString().split('T')[0],
      contactDetails: user?.phone || user?.email || '',
    },
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/lost-found';
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus) params.append('status', filterStatus);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setItems(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch items directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchQuery, filterStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setFileError('Only image attachments (JPEG, PNG, WEBP) are supported.');
        setSelectedFile(null);
      } else if (file.size > 5 * 1024 * 1024) {
        setFileError('Image file size must not exceed 5MB.');
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

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('status', data.status);
      formData.append('location', data.location);
      formData.append('dateLostFound', data.dateLostFound);
      formData.append('contactDetails', data.contactDetails);
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      await api.post('/lost-found', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowModal(false);
      setSelectedFile(null);
      reset();
      fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClaim = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening detailed modal
    if (!window.confirm('Mark this item as Claimed/Recovered? It will remain listed but shown as inactive.')) return;
    try {
      await api.patch(`/lost-found/${id}/status`, { status: 'claimed' });
      fetchItems();
      if (activeItem && activeItem._id === id) {
        setActiveItem(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed.');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Permanently remove this listing?')) return;
    try {
      await api.delete(`/lost-found/${id}`);
      fetchItems();
      if (activeItem && activeItem._id === id) {
        setActiveItem(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Deletion failed.');
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'lost':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'found':
        return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
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
            Report lost items or check found listings on campus.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 py-3 px-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/15"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Report Item</span>
        </button>
      </div>

      {/* Filter and Control Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center glass-panel-light dark:glass-panel-dark rounded-2xl p-4 border border-light-border dark:border-dark-border/30">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-light-muted dark:text-dark-muted w-4 h-4 my-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search item names, keywords, locations..."
            className="w-full pl-10 pr-4 py-2.5 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl outline-none text-xs text-light-text dark:text-dark-text"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-3 py-2.5 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl text-xs outline-none text-light-text dark:text-dark-text"
        >
          <option value="">All Listings</option>
          <option value="lost">Lost Items</option>
          <option value="found">Found Items</option>
          <option value="claimed">Claimed / Recovered</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Listings */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-light-card dark:bg-dark-card/50 rounded-3xl animate-pulse border border-light-border dark:border-dark-border/30" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-light-card dark:bg-dark-card/20 rounded-3xl border border-light-border dark:border-dark-border/30">
          <Inbox className="w-12 h-12 text-light-muted dark:text-dark-muted/40 mx-auto mb-4" />
          <h3 className="text-lg font-bold">No Listings Available</h3>
          <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
            Check back later or report a new lost/found item.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setActiveItem(item)}
              className="bg-white dark:bg-dark-card rounded-3xl border border-light-border dark:border-dark-border/30 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Image Section */}
                <div className="h-40 bg-light-bg dark:bg-dark-bg/60 relative border-b border-light-border dark:border-dark-border/30 flex items-center justify-center text-light-muted dark:text-dark-muted">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 opacity-60">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-[10px] font-semibold">No Image Provided</span>
                    </div>
                  )}

                  {/* Absolute Status Badge */}
                  <span className={`absolute top-4 left-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 border rounded-full backdrop-blur-md ${getStatusClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                {/* Info Text */}
                <div className="p-5">
                  <h4 className="text-base font-bold text-light-text dark:text-dark-text truncate mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2 leading-relaxed mb-4">
                    {item.description}
                  </p>

                  <div className="space-y-2 text-xs text-light-muted dark:text-dark-muted">
                    {item.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-500" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    )}
                    {item.dateLostFound && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(item.dateLostFound).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer actions */}
              <div className="px-5 pb-5 pt-3 border-t border-light-border dark:border-dark-border/20 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <img
                    src={item.reportedBy.avatar || 'https://res.cloudinary.com/dummy/image/upload/v1/campushub/avatars/default.png'}
                    alt={item.reportedBy.name}
                    className="w-5 h-5 rounded-full object-cover bg-light-border dark:bg-dark-border"
                  />
                  <span className="text-[10px] font-bold text-light-text dark:text-dark-text truncate max-w-[90px]">
                    {item.reportedBy.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Mark as claimed action for creator */}
                  {(item.reportedBy._id === user?._id || user?.role === 'admin') && item.status !== 'claimed' && (
                    <button
                      onClick={(e) => handleClaim(item._id, e)}
                      className="p-1.5 text-brand-500 hover:bg-brand-500/10 rounded-lg transition-all"
                      title="Mark as claimed"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete listing */}
                  {(item.reportedBy._id === user?._id || user?.role === 'admin') && (
                    <button
                      onClick={(e) => handleDelete(item._id, e)}
                      className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete Listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Item Detail Overlay Modal */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl border border-light-border dark:border-dark-border/40 p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-5 right-5 p-2 hover:bg-light-bg dark:hover:bg-dark-bg/60 rounded-xl text-light-muted dark:text-dark-muted"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-4">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 border rounded-full ${getStatusClass(activeItem.status)}`}>
                  {activeItem.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-4">
                {activeItem.title}
              </h3>

              {activeItem.imageUrl && (
                <div className="h-56 bg-light-bg dark:bg-dark-bg/40 rounded-2xl overflow-hidden mb-4 border border-light-border dark:border-dark-border/20">
                  <img
                    src={activeItem.imageUrl}
                    alt={activeItem.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <p className="text-sm text-light-muted dark:text-dark-muted leading-relaxed whitespace-pre-line mb-6">
                {activeItem.description}
              </p>

              <div className="space-y-3 border-t border-light-border dark:border-dark-border/20 pt-4 text-xs text-light-muted dark:text-dark-muted mb-6">
                {activeItem.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-500" />
                    <span>Location: <strong>{activeItem.location}</strong></span>
                  </div>
                )}
                {activeItem.dateLostFound && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-500" />
                    <span>Date: <strong>{new Date(activeItem.dateLostFound).toLocaleDateString()}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-500" />
                  <span>Contact Details: <strong>{activeItem.contactDetails}</strong></span>
                </div>
              </div>

              {/* Uploader Bio & Claim Action */}
              <div className="flex items-center justify-between bg-light-bg dark:bg-dark-bg/60 p-4 rounded-2xl border border-light-border dark:border-dark-border/20">
                <div className="flex items-center gap-2.5">
                  <img
                    src={activeItem.reportedBy.avatar || 'https://res.cloudinary.com/dummy/image/upload/v1/campushub/avatars/default.png'}
                    alt={activeItem.reportedBy.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-light-text dark:text-dark-text leading-none mb-1">
                      Reported by {activeItem.reportedBy.name}
                    </p>
                    <p className="text-[10px] text-light-muted dark:text-dark-muted">
                      Role: {activeItem.reportedBy.role}
                    </p>
                  </div>
                </div>

                {activeItem.status !== 'claimed' && (activeItem.reportedBy._id === user?._id || user?.role === 'admin') && (
                  <button
                    onClick={(e) => handleClaim(activeItem._id, e)}
                    className="py-2 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-500/10"
                  >
                    Mark as claimed
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Creation/Report Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl border border-light-border dark:border-dark-border/40 p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-brand-500" />
                  <span>Report Lost or Found Item</span>
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedFile(null);
                  }}
                  className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg/60 rounded-xl text-light-muted dark:text-dark-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                    Item Name / Title
                  </label>
                  <input
                    type="text"
                    {...register('title', { required: 'Item name is required' })}
                    className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                    placeholder="e.g. Leather Wallet / Blue Water Bottle"
                  />
                  {errors.title && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.title.message}</span>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                    Description & Key Identifiers
                  </label>
                  <textarea
                    rows={3}
                    {...register('description', { required: 'Description is required' })}
                    className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text resize-none"
                    placeholder="Describe brand, colors, logos, contents, keychain figures..."
                  />
                  {errors.description && (
                    <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                      Report Status
                    </label>
                    <select
                      {...register('status')}
                      className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                    >
                      <option value="lost">Lost</option>
                      <option value="found">Found</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                      Location Misplaced / Found
                    </label>
                    <input
                      type="text"
                      {...register('location')}
                      className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                      placeholder="e.g. Science Lab 4B / Library 2nd Floor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                      Date Misplaced / Found
                    </label>
                    <input
                      type="date"
                      {...register('dateLostFound')}
                      className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                    />
                  </div>

                  {/* Contact details */}
                  <div>
                    <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                      My Contact Info
                    </label>
                    <input
                      type="text"
                      {...register('contactDetails', { required: 'Contact details are required' })}
                      className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                      placeholder="e.g. Email or Phone number"
                    />
                    {errors.contactDetails && (
                      <span className="text-xs text-red-500 mt-1 block">{errors.contactDetails.message}</span>
                    )}
                  </div>
                </div>

                {/* File Attachment */}
                <div>
                  <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                    Item Image Attachment (Optional, Max 5MB)
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
                        Attach a snapshot of the item
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
                      setShowModal(false);
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
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Report</span>
                      </>
                    )}
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
export default LostFound;
