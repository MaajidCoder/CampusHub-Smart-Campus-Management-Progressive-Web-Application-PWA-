import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Briefcase,
  Building2,
  Calendar,
  Download,
  CheckCircle,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  Loader,
  Users,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Job {
  _id: string;
  company: string;
  title: string;
  description: string;
  ctc: string;
  location: string;
  eligibility: string;
  deadline: string;
  postedBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Student {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  semester: number;
  department: {
    _id: string;
    name: string;
    code: string;
  };
}

interface Application {
  _id: string;
  job: Job;
  student: Student;
  resumeUrl: string;
  resumePublicId: string;
  status: 'applied' | 'shortlisted' | 'technical_round' | 'interview' | 'selected' | 'rejected';
  createdAt: string;
}

interface JobFormInputs {
  company: string;
  title: string;
  description: string;
  ctc: string;
  location: string;
  eligibility: string;
  deadline: string;
}

export const Placements: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Tab: 'jobs' | 'applications' | 'post-job' | 'job-applicants'
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'post-job' | 'job-applicants'>('jobs');

  // Selected Job for viewing applicants (Admin/TPO)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicantsList, setApplicantsList] = useState<Application[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Apply Modal (Student)
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  // Deadline date picker parts
  const [deadlineDay, setDeadlineDay] = useState('');
  const [deadlineMonth, setDeadlineMonth] = useState('');
  const [deadlineYear, setDeadlineYear] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<JobFormInputs>({
    defaultValues: {
      company: '',
      title: '',
      description: '',
      ctc: '',
      location: '',
      eligibility: '',
      deadline: '',
    },
  });

  // Keep deadline field value in sync with the three dropdowns
  useEffect(() => {
    if (deadlineDay && deadlineMonth && deadlineYear) {
      // Compose ISO YYYY-MM-DD string
      const iso = `${deadlineYear}-${deadlineMonth.padStart(2, '0')}-${deadlineDay.padStart(2, '0')}`;
      setValue('deadline', iso, { shouldValidate: true });
    } else {
      setValue('deadline', '', { shouldValidate: false });
    }
  }, [deadlineDay, deadlineMonth, deadlineYear, setValue]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch open jobs (shared by both roles)
      const jobsRes = await api.get('/placements/jobs');
      setJobs(jobsRes.data.data);

      // Student: fetch applied jobs
      if (user?.role === 'student') {
        const appsRes = await api.get('/placements/my-applications');
        setMyApplications(appsRes.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch placements data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Load applicants for a specific job (Admin/TPO)
  useEffect(() => {
    const fetchApplicants = async () => {
      if (selectedJob && activeTab === 'job-applicants') {
        try {
          setLoadingApplicants(true);
          setError(null);
          const res = await api.get(`/placements/jobs/${selectedJob._id}/applicants`);
          setApplicantsList(res.data.data);
        } catch (err: any) {
          setError(err.response?.data?.message || 'Failed to fetch job applicants roster.');
        } finally {
          setLoadingApplicants(false);
        }
      }
    };
    fetchApplicants();
  }, [selectedJob, activeTab]);

  // Handle Resume file selection
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setResumeError('Resume file must be in PDF format.');
        setResumeFile(null);
      } else if (file.size > 15 * 1024 * 1024) {
        setResumeError('Resume size must not exceed 15MB.');
        setResumeFile(null);
      } else {
        setResumeFile(file);
      }
    }
  };

  // Submit Job Application
  const handleApplySubmit = async () => {
    if (!applyingJob) return;
    if (!resumeFile) {
      setResumeError('Please upload your resume PDF to apply.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('resume', resumeFile);

      await api.post(`/placements/jobs/${applyingJob._id}/apply`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(`Application submitted successfully for ${applyingJob.title} at ${applyingJob.company}!`);
      setApplyingJob(null);
      setResumeFile(null);

      // Refresh applications data
      setTimeout(() => {
        setSuccess(null);
        fetchData();
        setActiveTab('applications');
      }, 1500);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  // TPO: Post Job Opening
  const handleJobSubmit = async (data: JobFormInputs) => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await api.post('/placements/jobs', data);

      setSuccess('Job opening published successfully!');
      reset();
      // Reset date dropdowns too
      setDeadlineDay('');
      setDeadlineMonth('');
      setDeadlineYear('');

      setTimeout(() => {
        setSuccess(null);
        setActiveTab('jobs');
        fetchData();
      }, 1500);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish job opening.');
    } finally {
      setSubmitting(false);
    }
  };

  // TPO: Update Application pipeline status
  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      setError(null);
      await api.patch(`/placements/applications/${appId}/status`, { status: newStatus });
      
      // Update local state list
      setApplicantsList((prev) =>
        prev.map((app) => (app._id === appId ? { ...app, status: newStatus as any } : app))
      );
      
      setSuccess('Candidate recruitment stage updated!');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update recruitment status.');
    }
  };

  // TPO: Delete Job posting
  const handleJobDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this job posting? This will remove all associated applications.')) return;

    try {
      await api.delete(`/placements/jobs/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Job deletion failed.');
    }
  };

  // Helpers
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'selected':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'shortlisted':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'technical_round':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'interview':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: // applied
        return 'bg-brand-500/10 text-brand-500 border-brand-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Check if student already applied to a job
  const hasApplied = (jobId: string) => {
    return myApplications.some((app) => app.job._id === jobId);
  };

  return (
    <div className="space-y-6">
      {/* Tab selection header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border/40 pb-4">
        <div>
          <p className="text-sm text-light-muted dark:text-dark-muted">
            Manage placement records, recruitment drives, job openings, and resumes.
          </p>
        </div>

        {/* Tab options */}
        <div className="flex flex-wrap bg-light-bg dark:bg-dark-bg/60 p-1 rounded-2xl border border-light-border dark:border-dark-border/40 gap-1 self-start">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'jobs'
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            Job Openings
          </button>
          
          {user?.role === 'student' && (
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'applications'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
              }`}
            >
              My Applications
            </button>
          )}

          {(user?.role === 'admin' || user?.role === 'faculty') && (
            <>
              <button
                onClick={() => setActiveTab('post-job')}
                className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'post-job'
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
                }`}
              >
                Post Job
              </button>
              
              {selectedJob && (user?.role === 'admin' || selectedJob.postedBy?._id === user?._id) && (
                <button
                  onClick={() => setActiveTab('job-applicants')}
                  className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    activeTab === 'job-applicants'
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
                  }`}
                >
                  Applicants Pool
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl text-sm animate-fade-in">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* JOBS BOARD LISTING */}
      {activeTab === 'jobs' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="h-48 bg-light-card dark:bg-dark-card/50 rounded-3xl animate-pulse border border-light-border dark:border-dark-border/30" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 bg-light-card dark:bg-dark-card/20 rounded-3xl border border-light-border dark:border-dark-border/30">
              <Briefcase className="w-12 h-12 text-light-muted dark:text-dark-muted/40 mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Openings Listed</h3>
              <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
                There are no open placement or internship opportunities at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job) => {
                const applied = hasApplied(job._id);
                const hasPassed = new Date(job.deadline).getTime() < Date.now();

                return (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* Job details header */}
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-light-text dark:text-dark-text leading-tight flex items-center gap-1.5">
                            <Building2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                            <span>{job.company}</span>
                          </h4>
                          <span className="text-xs font-semibold text-light-muted dark:text-dark-muted block mt-1">
                            {job.title}
                          </span>
                        </div>

                        {/* CTC Badge */}
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-2xl flex-shrink-0">
                          {job.ctc}
                        </span>
                      </div>

                      <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed line-clamp-3 mb-4">
                        {job.description}
                      </p>

                      {/* Criteria */}
                      <div className="p-3 bg-light-bg dark:bg-dark-bg/60 rounded-2xl border border-light-border dark:border-dark-border/20 text-[11px] space-y-1.5 text-light-muted dark:text-dark-muted font-medium mb-4">
                        <p className="truncate">
                          <strong className="text-light-text dark:text-dark-text">Eligibility: </strong>
                          {job.eligibility}
                        </p>
                        <p className="truncate">
                          <strong className="text-light-text dark:text-dark-text">Location: </strong>
                          {job.location}
                        </p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between border-t border-light-border dark:border-dark-border/20 pt-4 mt-2">
                      <div className="flex items-center gap-1 text-[10px] text-light-muted dark:text-dark-muted font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Admin & Faculty actions: Delete or View applicants */}
                        {(user?.role === 'admin' || (user?.role === 'faculty' && job.postedBy?._id === user?._id)) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setActiveTab('job-applicants');
                              }}
                              className="py-1.5 px-3 bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white transition-colors rounded-xl text-[10px] font-bold"
                            >
                              Applicants
                            </button>
                            
                            <button
                              onClick={(e) => handleJobDelete(job._id, e)}
                              className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Student actions: Apply */}
                        {user?.role === 'student' && (
                          <button
                            disabled={applied || hasPassed}
                            onClick={() => setApplyingJob(job)}
                            className={`py-1.5 px-3.5 rounded-xl text-[10px] font-bold transition-all shadow-md ${
                              applied
                                ? 'bg-green-500 text-white shadow-green-500/10'
                                : hasPassed
                                ? 'bg-slate-400 text-white cursor-not-allowed shadow-none'
                                : 'bg-brand-500 text-white shadow-brand-500/15 hover:bg-brand-600'
                            }`}
                          >
                            {applied ? (
                              <span className="flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Applied
                              </span>
                            ) : hasPassed ? (
                              'Deadline Passed'
                            ) : (
                              'Apply Now'
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
      )}

      {/* STUDENT APPLICATIONS PROGRESS */}
      {activeTab === 'applications' && user?.role === 'student' && (
        <div className="space-y-6">
          {myApplications.length === 0 ? (
            <div className="text-center py-16 bg-light-card dark:bg-dark-card/20 rounded-3xl border border-light-border dark:border-dark-border/30">
              <FileText className="w-12 h-12 text-light-muted dark:text-dark-muted/40 mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Applications Filed</h3>
              <p className="text-sm text-light-muted dark:text-dark-muted mt-1">
                You have not applied for any job opening listings yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.map((app) => (
                <div
                  key={app._id}
                  className="bg-white dark:bg-dark-card rounded-3xl p-5 border border-light-border dark:border-dark-border/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex gap-4">
                    {/* Icon banner */}
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-500 flex-shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>

                    <div>
                      <h4 className="text-base font-bold leading-tight">
                        {app.job.company}
                      </h4>
                      <p className="text-xs text-light-muted dark:text-dark-muted font-medium mt-0.5">
                        {app.job.title} &bull; {app.job.location}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-light-muted dark:text-dark-muted font-semibold">
                        <span>Applied on: {new Date(app.createdAt).toLocaleDateString()}</span>
                        <span>&bull;</span>
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-500 hover:underline flex items-center gap-0.5"
                        >
                          <Download className="w-3 h-3" />
                          <span>View Submitted Resume</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1 border rounded-full self-start sm:self-auto ${getStatusBadgeClass(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                    
                    {app.status === 'selected' && (
                      <p className="text-[10px] font-extrabold text-green-500 animate-pulse">
                        Congratulations! Offer received! 🎉
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TPO: POST JOB FORM */}
      {activeTab === 'post-job' && (user?.role === 'admin' || user?.role === 'faculty') && (
        <div className="max-w-xl mx-auto glass-panel-light dark:glass-panel-dark rounded-3xl p-8 border border-light-border dark:border-dark-border/30 shadow-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-500" />
            <span>Publish Placement / Internship Opening</span>
          </h3>

          <form onSubmit={handleSubmit(handleJobSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  {...register('company', { required: 'Company name is required' })}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                  placeholder="e.g. Google India / TCS"
                />
                {errors.company && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.company.message}</span>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Job Position Title
                </label>
                <input
                  type="text"
                  {...register('title', { required: 'Job title is required' })}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                  placeholder="e.g. Software Development Engineer"
                />
                {errors.title && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.title.message}</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Job Description
              </label>
              <textarea
                rows={4}
                {...register('description', { required: 'Job description is required' })}
                className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text resize-none"
                placeholder="Details about responsibilities, skill stacks, job roles..."
              />
              {errors.description && (
                <span className="text-xs text-red-500 mt-1 block">{errors.description.message}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CTC */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  CTC Package details
                </label>
                <input
                  type="text"
                  {...register('ctc', { required: 'CTC details are required' })}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                  placeholder="e.g. 12 LPA / 45k/month"
                />
                {errors.ctc && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.ctc.message}</span>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Job Location
                </label>
                <input
                  type="text"
                  {...register('location', { required: 'Job location is required' })}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                  placeholder="e.g. Bangalore, KA / Pune (Remote)"
                />
                {errors.location && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.location.message}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Eligibility */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Eligibility Criteria
                </label>
                <input
                  type="text"
                  {...register('eligibility', { required: 'Eligibility criteria is required' })}
                  className="w-full px-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                  placeholder="e.g. CGPA >= 7.5, CSE/IT only"
                />
                {errors.eligibility && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.eligibility.message}</span>
                )}
              </div>

              {/* Deadline - 3-part Day/Month/Year picker */}
              <div>
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Submission Deadline
                </label>

                {/* Hidden input keeps deadline in the react-hook-form state */}
                <Controller
                  name="deadline"
                  control={control}
                  rules={{ required: 'Deadline date is required' }}
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                <div className="grid grid-cols-3 gap-2">
                  {/* Day */}
                  <div>
                    <select
                      value={deadlineDay}
                      onChange={(e) => setDeadlineDay(e.target.value)}
                      className="w-full px-3 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={String(d)}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Month */}
                  <div>
                    <select
                      value={deadlineMonth}
                      onChange={(e) => setDeadlineMonth(e.target.value)}
                      className="w-full px-3 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                    >
                      <option value="">Month</option>
                      {[
                        'January','February','March','April','May','June',
                        'July','August','September','October','November','December'
                      ].map((m, idx) => (
                        <option key={m} value={String(idx + 1)}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <select
                      value={deadlineYear}
                      onChange={(e) => setDeadlineYear(e.target.value)}
                      className="w-full px-3 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text"
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                        <option key={y} value={String(y)}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {errors.deadline && (
                  <span className="text-xs text-red-500 mt-1 block">{errors.deadline.message}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-light-border dark:border-dark-border/20">
              <button
                type="button"
                onClick={() => {
                  reset();
                  setActiveTab('jobs');
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
                  <span>Publish Opening</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TPO: APPLICANTS POOL LIST */}
      {activeTab === 'job-applicants' && selectedJob && (user?.role === 'admin' || (user?.role === 'faculty' && selectedJob.postedBy?._id === user?._id)) && (
        <div className="space-y-6">
          <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-6 border border-light-border dark:border-dark-border/30">
            <button
              onClick={() => {
                setSelectedJob(null);
                setActiveTab('jobs');
              }}
              className="text-xs font-semibold text-brand-500 hover:underline mb-2 block"
            >
              &larr; Back to Openings
            </button>
            <h3 className="text-lg font-bold text-light-text dark:text-dark-text leading-tight">
              Applicants Pool for {selectedJob.title}
            </h3>
            <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
              Company: {selectedJob.company} &bull; Active Applicants Count: {applicantsList.length}
            </p>
          </div>

          {loadingApplicants ? (
            <div className="text-center py-10">
              <Loader className="w-8 h-8 animate-spin text-brand-500 mx-auto" />
            </div>
          ) : applicantsList.length === 0 ? (
            <div className="text-center py-10 bg-light-card dark:bg-dark-card/20 rounded-3xl border border-light-border dark:border-dark-border/30">
              <Users className="w-10 h-10 text-light-muted dark:text-dark-muted/30 mx-auto mb-3" />
              <p className="text-sm text-light-muted dark:text-dark-muted">
                No students have applied to this position opening yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-light-border dark:border-dark-border/20 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-light-bg dark:bg-dark-bg/60 text-light-muted dark:text-dark-muted border-b border-light-border dark:border-dark-border/20 font-bold uppercase tracking-wider">
                    <th className="p-4">Student Candidate</th>
                    <th className="p-4">Major / Semester</th>
                    <th className="p-4">Resume PDF</th>
                    <th className="p-4">Recruitment Pipeline Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border/10">
                  {applicantsList.map((app) => (
                    <tr key={app._id} className="hover:bg-light-bg/30 dark:hover:bg-dark-bg/20 transition-colors">
                      <td className="p-4 font-semibold text-light-text dark:text-dark-text flex items-center gap-2.5">
                        <img
                          src={app.student.avatar || 'https://res.cloudinary.com/dummy/image/upload/v1/campushub/avatars/default.png'}
                          alt={app.student.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <span>{app.student.name}</span>
                          <span className="block text-[9px] font-medium text-light-muted dark:text-dark-muted mt-0.5">{app.student.email}</span>
                        </div>
                      </td>
                      <td className="p-4 text-light-muted dark:text-dark-muted font-medium">
                        {app.student.department?.code} (Semester {app.student.semester})
                      </td>
                      <td className="p-4">
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500 hover:text-white text-brand-500 transition-all rounded-lg font-bold text-[10px]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </td>
                      <td className="p-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app._id, e.target.value)}
                          className="px-2 py-1.5 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border/30 rounded-lg text-[10px] font-bold outline-none text-light-text dark:text-dark-text"
                        >
                          <option value="applied">Applied</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="technical_round">Technical Round</option>
                          <option value="interview">Interview Round</option>
                          <option value="selected">Selected</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Student Resume PDF Submission Modal */}
      <AnimatePresence>
        {applyingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card w-full max-w-md rounded-3xl border border-light-border dark:border-dark-border/40 p-6 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setApplyingJob(null);
                  setResumeFile(null);
                  setResumeError(null);
                }}
                className="absolute top-5 right-5 p-2 hover:bg-light-bg dark:hover:bg-dark-bg/60 rounded-xl text-light-muted dark:text-dark-muted"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" />
                <span>Submit Job Application</span>
              </h3>

              <div className="p-4 bg-light-bg dark:bg-dark-bg/60 rounded-2xl border border-light-border dark:border-dark-border/30 mb-5">
                <h4 className="text-xs font-bold leading-tight">{applyingJob.company}</h4>
                <p className="text-[10px] text-light-muted dark:text-dark-muted font-semibold mt-0.5">{applyingJob.title}</p>
              </div>

              <div className="space-y-4">
                {/* File Drop */}
                <div>
                  <label className="block text-[10px] font-bold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                    Upload Resume PDF (Max 15MB)
                  </label>
                  
                  <div className="relative border-2 border-dashed border-light-border dark:border-dark-border/50 rounded-2xl p-6 flex flex-col items-center justify-center bg-light-bg/50 dark:bg-dark-bg/30">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileText className="w-8 h-8 text-light-muted dark:text-dark-muted/50 mb-2" />
                    {resumeFile ? (
                      <span className="text-xs font-bold text-brand-500 truncate max-w-[200px]">
                        {resumeFile.name}
                      </span>
                    ) : (
                      <span className="text-xs text-light-muted dark:text-dark-muted text-center leading-normal">
                        Click or drag PDF resume file here
                      </span>
                    )}
                  </div>
                  {resumeError && (
                    <span className="text-xs text-red-500 mt-1 block font-medium">{resumeError}</span>
                  )}
                </div>

                <button
                  onClick={handleApplySubmit}
                  disabled={submitting || !resumeFile}
                  className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirm and Apply</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Placements;
