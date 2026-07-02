import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  ShoppingBag,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  AlertCircle,
  Loader,
  Image as ImageIcon,
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Seller {
  _id: string;
  name: string;
  avatar: string;
  email: string;
  phone?: string;
}

interface Listing {
  _id: string;
  title: string;
  description: string;
  category: 'books' | 'calculator' | 'lab_coat' | 'laptop' | 'cycle' | 'other';
  price: number;
  imageUrl: string;
  imagePublicId: string;
  seller: Seller;
  contactDetails: string;
  status: 'pending' | 'approved' | 'rejected' | 'sold';
  createdAt: string;
}

interface SellFormInputs {
  title: string;
  description: string;
  category: 'books' | 'calculator' | 'lab_coat' | 'laptop' | 'cycle' | 'other';
  price: string;
  contactDetails: string;
}

export const Marketplace: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tabs: 'browse' | 'sell' | 'my-items' | 'admin-moderation'
  const [activeTab, setActiveTab] = useState<'browse' | 'sell' | 'my-items' | 'admin-moderation'>('browse');

  // Detail Modal
  const [activeItem, setActiveItem] = useState<Listing | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // File Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SellFormInputs>({
    defaultValues: {
      title: '',
      description: '',
      category: 'books',
      price: '',
      contactDetails: user?.phone || user?.email || '',
    },
  });

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/marketplace';
      const params = new URLSearchParams();

      if (activeTab === 'browse') {
        if (searchQuery) params.append('search', searchQuery);
        if (filterCategory) params.append('category', filterCategory);
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      } else if (activeTab === 'my-items') {
        url = '/marketplace/my-listings';
      } else if (activeTab === 'admin-moderation') {
        url = '/marketplace/pending';
      }

      const response = await api.get(url);
      setListings(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch marketplace listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [searchQuery, filterCategory, activeTab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setFileError('Only product image files (JPEG, PNG, WEBP) are supported.');
        setSelectedFile(null);
      } else if (file.size > 5 * 1024 * 1024) {
        setFileError('Product image size must not exceed 5MB.');
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const onSubmit = async (data: any) => {
    if (!selectedFile) {
      setFileError('Product photo upload is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('price', data.price);
      formData.append('contactDetails', data.contactDetails);
      formData.append('image', selectedFile);

      await api.post('/marketplace', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Item listing created! Awaiting administrator approval.');
      reset();
      setSelectedFile(null);

      setTimeout(() => {
        setSuccess(null);
        setActiveTab('my-items');
        fetchListings();
      }, 1500);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to list item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected' | 'sold', e: React.MouseEvent) => {
    e.stopPropagation();
    const actionText = newStatus === 'sold' ? 'mark as sold' : `set status to ${newStatus}`;
    if (!window.confirm(`Are you sure you want to ${actionText} for this item?`)) return;

    try {
      await api.patch(`/marketplace/${id}/status`, { status: newStatus });
      fetchListings();
      if (activeItem && activeItem._id === id) {
        setActiveItem(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this listing?')) return;

    try {
      await api.delete(`/marketplace/${id}`);
      fetchListings();
      if (activeItem && activeItem._id === id) {
        setActiveItem(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Deletion failed.');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20'; // sold
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Tab selection header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border/40 pb-4">
        <div>
          <p className="text-sm text-light-muted dark:text-dark-muted">
            Trade books, lab coats, laptops, cycles, and other campus items.
          </p>
        </div>

        {/* Tab options */}
        <div className="flex flex-wrap bg-light-bg dark:bg-dark-bg/60 p-1 rounded-2xl border border-light-border dark:border-dark-border/40 gap-1">
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'browse'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            Browse Marketplace
          </button>
          
          <button
            onClick={() => setActiveTab('sell')}
            className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'sell'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            List Item
          </button>

          <button
            onClick={() => setActiveTab('my-items')}
            className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'my-items'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            My Listings
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin-moderation')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'admin-moderation'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
              }`}
            >
              Approvals Board
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Browse Catalog View */}
      {activeTab === 'browse' && (
        <>
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center glass-panel-light dark:glass-panel-dark rounded-2xl p-4 border border-light-border dark:border-dark-border/30">
            {/* Search */}
            <div className="relative sm:col-span-2">
              <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-light-muted dark:text-dark-muted w-4 h-4 my-auto" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, textbooks, cycles..."
                className="w-full pl-10 pr-4 py-2.5 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl outline-none text-xs text-light-text dark:text-dark-text"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl text-xs outline-none text-light-text dark:text-dark-text"
            >
              <option value="">All Categories</option>
              <option value="books">Books</option>
              <option value="calculator">Calculator</option>
              <option value="lab_coat">Lab Coat</option>
              <option value="laptop">Laptop</option>
              <option value="cycle">Cycle</option>
              <option value="other">Other</option>
            </select>
          </div>
        </>
      )}

      {/* Grid of Listings */}
      {activeTab !== 'sell' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 bg-light-card dark:bg-dark-card/50 rounded-3xl animate-pulse border border-light-border dark:border-dark-border/30" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 bg-light-card dark:bg-dark-card/20 rounded-3xl border border-light-border dark:border-dark-border/30">
              <ShoppingBag className="w-12 h-12 text-light-muted dark:text-dark-muted/40 mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Items Available</h3>
              <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
                {activeTab === 'browse'
                  ? 'There are no active items listed in this category.'
                  : activeTab === 'my-items'
                  ? 'You have not uploaded any product listings yet.'
                  : 'There are no listings waiting for administrator approvals.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setActiveItem(item)}
                  className="bg-white dark:bg-dark-card rounded-3xl border border-light-border dark:border-dark-border/30 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Image Header */}
                    <div className="h-44 bg-light-bg dark:bg-dark-bg/60 border-b border-light-border dark:border-dark-border/30 relative overflow-hidden flex items-center justify-center">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Price Badge */}
                      <span className="absolute top-4 right-4 bg-brand-500 text-white font-extrabold text-xs px-3 py-1.5 rounded-2xl shadow-md">
                        ${item.price}
                      </span>

                      {/* Status / Category Badges */}
                      <span className={`absolute top-4 left-4 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 border rounded-full backdrop-blur-md ${
                        activeTab === 'browse' ? 'bg-white/90 dark:bg-dark-card/90 text-light-text dark:text-dark-text border-light-border dark:border-dark-border/40' : getStatusBadgeClass(item.status)
                      }`}>
                        {activeTab === 'browse' ? getCategoryLabel(item.category) : item.status}
                      </span>
                    </div>

                    {/* Description body */}
                    <div className="p-5">
                      <h4 className="text-base font-bold text-light-text dark:text-dark-text truncate mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="px-5 pb-5 pt-3 border-t border-light-border dark:border-dark-border/20 flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={item.seller.avatar || 'https://res.cloudinary.com/dummy/image/upload/v1/campushub/avatars/default.png'}
                        alt={item.seller.name}
                        className="w-5 h-5 rounded-full object-cover bg-light-border dark:bg-dark-border"
                      />
                      <span className="text-[10px] font-bold text-light-text dark:text-dark-text truncate max-w-[90px]">
                        {item.seller.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Admin moderation tools */}
                      {activeTab === 'admin-moderation' && (
                        <>
                          <button
                            onClick={(e) => handleStatusUpdate(item._id, 'approved', e)}
                            className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg transition-all"
                            title="Approve Listing"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleStatusUpdate(item._id, 'rejected', e)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Reject Listing"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Mark as sold option for seller */}
                      {activeTab === 'my-items' && item.status === 'approved' && (
                        <button
                          onClick={(e) => handleStatusUpdate(item._id, 'sold', e)}
                          className="py-1 px-2.5 bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white border border-brand-500/20 transition-all rounded-lg text-[9px] font-bold"
                          title="Mark as Sold"
                        >
                          Mark Sold
                        </button>
                      )}

                      {/* Owner or Admin deletes listing */}
                      {(item.seller._id === user?._id || user?.role === 'admin') && (
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
        </>
      )}

      {/* Sell Item Form View */}
      {activeTab === 'sell' && (
        <div className="max-w-xl mx-auto glass-panel-light dark:glass-panel-dark rounded-3xl p-8 border border-light-border dark:border-dark-border/30 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-500" />
            <span>List Product for Sale</span>
          </h3>

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
                Item / Product Title
              </label>
              <input
                type="text"
                {...register('title', { required: 'Product name is required' })}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                placeholder="e.g. Lab Coat (Size M) / Calculus 10th Ed Textbook"
              />
              {errors.title && (
                <span className="text-xs text-red-500 mt-1 block">{errors.title.message}</span>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Product Condition & Details
              </label>
              <textarea
                rows={4}
                {...register('description', { required: 'Product description is required' })}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text resize-none"
                placeholder="Describe usage wear, edition codes, battery health, missing items..."
              />
              {errors.description && (
                <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Category
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                >
                  <option value="books">Books</option>
                  <option value="calculator">Calculator</option>
                  <option value="lab_coat">Lab Coat</option>
                  <option value="laptop">Laptop</option>
                  <option value="cycle">Cycle</option>
                  <option value="other">Other</option>
                </select>
                {errors.category && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.category.message}</span>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Price ($ USD)
                </label>
                <input
                  type="number"
                  {...register('price', {
                    required: 'Price is required',
                    min: { value: 0, message: 'Price cannot be negative' },
                  })}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                  placeholder="25"
                />
                {errors.price && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.price.message}</span>
                )}
              </div>
            </div>

            {/* Contact details */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                My Contact Details
              </label>
              <input
                type="text"
                {...register('contactDetails', { required: 'Seller contact is required' })}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                placeholder="e.g. Email address or phone number"
              />
              {errors.contactDetails && (
                <span className="text-xs text-red-500 mt-1 block">{errors.contactDetails.message}</span>
              )}
            </div>

            {/* File Attachment */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Product Image (Required, Max 5MB)
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
                    Select a snapshot of the item showing its condition
                  </span>
                )}
              </div>
              {fileError && <span className="text-xs text-red-500 mt-1 block">{fileError}</span>}
            </div>

            {/* Actions */}
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
                    <span>Publishing Listing...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Listing</span>
                  </>
                )}
              </button>
            </div>
          </form>
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

              <div className="mb-4 flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 border rounded-full bg-brand-500/10 text-brand-500 border-brand-500/20">
                  {getCategoryLabel(activeItem.category)}
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 border rounded-full ${getStatusBadgeClass(activeItem.status)}`}>
                  {activeItem.status}
                </span>
              </div>

              <h3 className="text-xl font-bold text-light-text dark:text-dark-text mb-4 pr-10">
                {activeItem.title}
              </h3>

              <div className="h-56 bg-light-bg dark:bg-dark-bg/40 rounded-2xl overflow-hidden mb-4 border border-light-border dark:border-dark-border/20">
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-extrabold text-brand-500">
                  ${activeItem.price}
                </span>
                
                {activeItem.status === 'approved' && activeItem.seller._id === user?._id && (
                  <button
                    onClick={(e) => handleStatusUpdate(activeItem._id, 'sold', e)}
                    className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-green-500/10"
                  >
                    Mark as sold
                  </button>
                )}
              </div>

              <p className="text-sm text-light-muted dark:text-dark-muted leading-relaxed whitespace-pre-line mb-6">
                {activeItem.description}
              </p>

              <div className="space-y-3 border-t border-light-border dark:border-dark-border/20 pt-4 text-xs text-light-muted dark:text-dark-muted mb-6">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-500" />
                  <span>Seller Contact Info: <strong>{activeItem.contactDetails}</strong></span>
                </div>
              </div>

              {/* Seller details card */}
              <div className="flex items-center gap-3 bg-light-bg dark:bg-dark-bg/60 p-4 rounded-2xl border border-light-border dark:border-dark-border/20">
                <img
                  src={activeItem.seller.avatar || 'https://res.cloudinary.com/dummy/image/upload/v1/campushub/avatars/default.png'}
                  alt={activeItem.seller.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <p className="text-xs font-bold text-light-text dark:text-dark-text leading-none mb-1">
                    Listed by {activeItem.seller.name}
                  </p>
                  <p className="text-[10px] text-light-muted dark:text-dark-muted">
                    Seller Email: {activeItem.seller.email}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Marketplace;
