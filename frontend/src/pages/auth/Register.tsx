import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, Lock, UserPlus, AlertCircle, Loader, BookOpen, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface Dept {
  _id: string;
  name: string;
  code: string;
}

export const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student' as 'student' | 'faculty',
      department: '',
      semester: '',
      phone: '',
    },
  });

  const selectedRole = watch('role');

  // Fetch departments on mount
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        setLoadingDepts(true);
        const response = await api.get('/departments');
        setDepartments(response.data.data || []);
      } catch (err) {
        console.warn('Could not fetch departments, using fallback list');
        // Fallback departments in case database is empty or connection fails
        setDepartments([
          { _id: '507f1f77bcf86cd799439011', name: 'Computer Science & Engineering', code: 'CSE' },
          { _id: '507f1f77bcf86cd799439012', name: 'Electronics & Communication Engineering', code: 'ECE' },
          { _id: '507f1f77bcf86cd799439013', name: 'Electrical & Electronics Engineering', code: 'EEE' },
          { _id: '507f1f77bcf86cd799439014', name: 'Information Technology', code: 'IT' },
          { _id: '507f1f77bcf86cd799439015', name: 'Computer Science & Business Systems', code: 'CSBS' },
          { _id: '507f1f77bcf86cd799439016', name: 'Mechanical Engineering', code: 'MECH' },
          { _id: '507f1f77bcf86cd799439017', name: 'Artificial Intelligence & Data Science', code: 'AIDS' },
        ]);
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      setApiError(null);
      setApiSuccess(null);
      setSubmitting(true);

      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone || undefined,
        department: data.department || undefined,
        semester: data.role === 'student' ? Number(data.semester) : undefined,
      };

      const message = await registerUser(payload);
      
      setApiSuccess(message || 'Account registration successful.');

      // Wait 3 seconds and navigate depending on role
      setTimeout(() => {
        if (data.role === 'student') {
          navigate('/student/dashboard');
        } else {
          navigate('/login');
        }
      }, 3000);

    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-light-bg dark:bg-dark-bg mesh-bg-light dark:mesh-bg-dark transition-all duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg my-8"
      >
        {/* College Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/college-logo.png"
              alt="Francis Xavier Engineering College Logo"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-lg font-extrabold text-light-text dark:text-dark-text leading-tight tracking-tight">
            Francis Xavier Engineering College
          </h1>
          <p className="text-xs text-light-muted dark:text-dark-muted font-medium tracking-widest uppercase mt-0.5">
            An Autonomous Institution
          </p>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-grow h-px bg-light-border dark:bg-dark-border/40" />
            <span className="text-sm font-extrabold tracking-tight text-light-text dark:text-dark-text">
              Campus<span className="text-brand-500">Hub</span>
            </span>
            <div className="flex-grow h-px bg-light-border dark:bg-dark-border/40" />
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            Create an account to access campus services
          </p>
        </div>

        {/* Glassmorphic Registration Card */}
        <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-dark-border/30">
          <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-6">
            Sign Up
          </h2>

          {apiError && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl mb-6 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl mb-6 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{apiSuccess} Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role Switcher */}
            <div>
              <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                I am registering as
              </label>
              <div className="grid grid-cols-2 gap-3 bg-light-bg dark:bg-dark-bg/60 p-1.5 rounded-2xl border border-light-border dark:border-dark-border/40">
                <button
                  type="button"
                  onClick={() => setValue('role', 'student')}
                  className={`py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    selectedRole === 'student'
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setValue('role', 'faculty')}
                  className={`py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    selectedRole === 'faculty'
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  Faculty Member
                </button>
              </div>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full pl-12 pr-4 py-3.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-base text-light-text dark:text-dark-text transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              {errors.name && (
                <span className="text-sm text-red-500 mt-1 block">{errors.name.message}</span>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Campus Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="w-full pl-12 pr-4 py-3.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-base text-light-text dark:text-dark-text transition-all"
                  placeholder="johndoe@university.edu"
                />
              </div>
              {errors.email && (
                <span className="text-sm text-red-500 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full pl-12 pr-4 py-3.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-base text-light-text dark:text-dark-text transition-all"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department Selector */}
              <div>
                <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                  Department
                </label>
                <select
                  {...register('department', { required: 'Department selection is required' })}
                  className="w-full px-4 py-3.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-base text-light-text dark:text-dark-text transition-all"
                >
                  {loadingDepts ? (
                    <option value="" className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">Loading departments...</option>
                  ) : (
                    <>
                      <option value="" className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">Select Department</option>
                      {departments.map((dept) => (
                        <option
                          key={dept._id}
                          value={dept._id}
                          className="bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text"
                        >
                          {dept.name} ({dept.code})
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {errors.department && (
                  <span className="text-sm text-red-500 mt-1 block">{errors.department.message}</span>
                )}
              </div>

              {/* Semester - Only visible for Student role */}
              <AnimatePresence mode="wait">
                {selectedRole === 'student' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                      Semester
                    </label>
                    <select
                      {...register('semester', { required: 'Semester selection is required' })}
                      className="w-full px-4 py-3.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-base text-light-text dark:text-dark-text transition-all"
                    >
                      <option value="" className="bg-light-bg dark:bg-dark-bg">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem} className="bg-light-bg dark:bg-dark-bg">
                          Semester {sem}
                        </option>
                      ))}
                    </select>
                    {errors.semester && (
                      <span className="text-sm text-red-500 mt-1 block">{errors.semester.message}</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="w-full pl-12 pr-4 py-3.5 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-base text-light-text dark:text-dark-text transition-all"
                  placeholder="•••••••• (Min 6 chars)"
                />
              </div>
              {errors.password && (
                <span className="text-sm text-red-500 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl text-base font-semibold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 pt-6 border-t border-light-border dark:border-dark-border/30 text-center">
            <p className="text-base text-light-muted dark:text-dark-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Register;
