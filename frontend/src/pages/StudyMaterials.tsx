import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FileText,
  Download,
  Trash2,
  UploadCloud,
  Search,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface Note {
  _id: string;
  title: string;
  description?: string;
  subject: string;
  department: Department;
  semester: number;
  fileUrl: string;
  filePublicId?: string;
  downloadCount: number;
  uploadedBy: {
    _id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

export const StudyMaterials: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Navigation tabs (Only relevant for Faculty uploader role)
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');

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
      subject: '',
      department: '',
      semester: '',
    },
  });

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = '/notes';
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterDept) params.append('department', filterDept);
      if (filterSem) params.append('semester', filterSem);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      setNotes(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not fetch study materials.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data || []);
    } catch (err) {
      console.error('Failed to load departments list');
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [searchQuery, filterDept, filterSem]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setFileError('Only PDF documents are supported for note uploads.');
        setSelectedFile(null);
      } else if (file.size > 15 * 1024 * 1024) {
        setFileError('File size must not exceed 15MB.');
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const onSubmit = async (data: any) => {
    if (!selectedFile) {
      setFileError('Please select a PDF document file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      // Multer file upload requires Form Data
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('subject', data.subject);
      formData.append('department', data.department);
      formData.append('semester', data.semester);
      formData.append('file', selectedFile);

      await api.post('/notes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Notes uploaded and published successfully!');
      reset();
      setSelectedFile(null);
      
      // Delay tab redirect slightly to display success notice
      setTimeout(() => {
        setSuccess(null);
        setActiveTab('browse');
        fetchNotes();
      }, 1500);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string, fileUrl: string) => {
    try {
      // Increment counter in DB
      await api.post(`/notes/${id}/download`);
      
      // Refresh list to update counters
      setNotes((prev) =>
        prev.map((n) => (n._id === id ? { ...n, downloadCount: n.downloadCount + 1 } : n))
      );
      
      // Open file in new tab or download
      window.open(fileUrl, '_blank');
    } catch (err) {
      console.error('Download counter tracking failed', err);
      window.open(fileUrl, '_blank');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove these study notes?')) return;
    try {
      await api.delete(`/notes/${id}`);
      fetchNotes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header with Tabs for Faculty */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border/40 pb-4">
        <div>
          <p className="text-sm text-light-muted dark:text-dark-muted">
            Share and retrieve textbook chapters, handouts, and lecture resources.
          </p>
        </div>

        {/* Tab Selector if role is Faculty */}
        {user?.role === 'faculty' && (
          <div className="flex bg-light-bg dark:bg-dark-bg/60 p-1 rounded-2xl border border-light-border dark:border-dark-border/40 self-start">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'browse'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
              }`}
            >
              Browse Repository
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'upload'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
              }`}
            >
              Upload Notes
            </button>
          </div>
        )}
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* Filtering and Searching Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center glass-panel-light dark:glass-panel-dark rounded-2xl p-4 border border-light-border dark:border-dark-border/30">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-light-muted dark:text-dark-muted w-4 h-4 my-auto" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, subjects, titles..."
                className="w-full pl-10 pr-4 py-2.5 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl outline-none text-xs text-light-text dark:text-dark-text"
              />
            </div>

            {/* Department Filter */}
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full px-3 py-2.5 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl text-xs outline-none text-light-text dark:text-dark-text"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.code}
                </option>
              ))}
            </select>

            {/* Semester Filter */}
            <select
              value={filterSem}
              onChange={(e) => setFilterSem(e.target.value)}
              className="w-full px-3 py-2.5 bg-light-bg dark:bg-dark-bg/60 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-xl text-xs outline-none text-light-text dark:text-dark-text"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Directory Listings */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-44 bg-light-card dark:bg-dark-card/50 rounded-3xl animate-pulse border border-light-border dark:border-dark-border/30" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 bg-light-card dark:bg-dark-card/20 rounded-3xl border border-light-border dark:border-dark-border/30">
              <BookOpen className="w-12 h-12 text-light-muted dark:text-dark-muted/40 mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Materials Found</h3>
              <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
                Try modifying your department, semester, or search terms.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <motion.div
                  key={note._id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative group"
                >
                  <div>
                    {/* Header: Dept & Sem */}
                    <div className="flex items-center justify-between mb-3 text-[10px] font-bold text-light-muted dark:text-dark-muted">
                      <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">
                        {note.department.code}
                      </span>
                      <span>Semester {note.semester}</span>
                    </div>

                    {/* Title */}
                    <h4 className="text-base font-bold text-light-text dark:text-dark-text mb-1 truncate">
                      {note.title}
                    </h4>
                    <p className="text-xs text-brand-500 font-semibold mb-3">
                      Subject: {note.subject}
                    </p>
                    
                    {note.description && (
                      <p className="text-xs text-light-muted dark:text-dark-muted line-clamp-2 leading-relaxed mb-4">
                        {note.description}
                      </p>
                    )}
                  </div>

                  {/* Actions & Creator */}
                  <div className="border-t border-light-border dark:border-dark-border/20 pt-4 flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={note.uploadedBy.avatar || 'https://res.cloudinary.com/dummy/image/upload/v1/campushub/avatars/default.png'}
                        alt={note.uploadedBy.name}
                        className="w-6 h-6 rounded-full object-cover bg-light-border dark:bg-dark-border"
                      />
                      <span className="text-[10px] font-semibold text-light-muted dark:text-dark-muted truncate max-w-[80px]">
                        {note.uploadedBy.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Delete notes uploader or Admin */}
                      {(note.uploadedBy._id === user?._id || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDelete(note._id)}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Notes"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Download */}
                      <button
                        onClick={() => handleDownload(note._id, note.fileUrl)}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-xl text-[10px] font-bold shadow-md shadow-brand-500/10 transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>{note.downloadCount}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Notes Upload Form Panel */
        <div className="max-w-xl mx-auto glass-panel-light dark:glass-panel-dark rounded-3xl p-8 border border-light-border dark:border-dark-border/30 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-brand-500" />
            <span>Upload Course Resources</span>
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
                Document Title
              </label>
              <input
                type="text"
                {...register('title', { required: 'Document title is required' })}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                placeholder="e.g. Unit 3 Lecture Handout"
              />
              {errors.title && (
                <span className="text-xs text-red-500 mt-1 block">{errors.title.message}</span>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Subject Name / Code
              </label>
              <input
                type="text"
                {...register('subject', { required: 'Subject name is required' })}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                placeholder="e.g. Advanced Data Structures"
              />
              {errors.subject && (
                <span className="text-xs text-red-500 mt-1 block">{errors.subject.message}</span>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                {...register('description')}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text resize-none"
                placeholder="Brief summary of note chapters, slides reference..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Target Department
                </label>
                <select
                  {...register('department', { required: 'Department is required' })}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.department.message}</span>
                )}
              </div>

              {/* Semester */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Semester
                </label>
                <select
                  {...register('semester', { required: 'Semester is required' })}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
                {errors.semester && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.semester.message}</span>
                )}
              </div>
            </div>

            {/* Multer PDF upload drop area */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Upload File (PDF Only, Max 15MB)
              </label>
              <div className="relative border-2 border-dashed border-light-border dark:border-dark-border/50 rounded-2xl p-6 flex flex-col items-center justify-center bg-light-bg/50 dark:bg-dark-bg/30">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="w-10 h-10 text-light-muted dark:text-dark-muted/50 mb-2" />
                {selectedFile ? (
                  <span className="text-sm font-bold text-brand-500 truncate max-w-[250px]">
                    {selectedFile.name}
                  </span>
                ) : (
                  <span className="text-xs text-light-muted dark:text-dark-muted text-center leading-normal">
                    Click to select file or drag & drop here
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
                disabled={uploading}
                className="py-3 px-5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-lg shadow-brand-500/15 flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Uploading to Cloud...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Notes</span>
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
export default StudyMaterials;
