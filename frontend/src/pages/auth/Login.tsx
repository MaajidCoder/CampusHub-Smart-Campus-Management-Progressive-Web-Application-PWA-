import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Calculate redirect route
  const from = (location.state as any)?.from?.pathname || '/';

  const onSubmit = async (data: any) => {
    try {
      setApiError(null);
      setSubmitting(true);
      const user = await login(data.email, data.password);
      
      // Redirect to the originally requested page, or fallback to the role-based dashboard
      if (from !== '/' && from !== '/login' && from !== '/register') {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (user.role === 'faculty') {
          navigate('/faculty/dashboard', { replace: true });
        } else {
          navigate('/student/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      setApiError(err.message || 'Login failed. Please verify credentials.');
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
        className="w-full max-w-md"
      >
        {/* College Brand Header */}
        <div className="text-center mb-8">
          {/* College Logo */}
          <div className="flex justify-center mb-4">
            <img
              src="/college-logo.png"
              alt="Francis Xavier Engineering College Logo"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          {/* College Name */}
          <h1 className="text-lg font-extrabold text-light-text dark:text-dark-text leading-tight tracking-tight">
            Francis Xavier Engineering College
          </h1>
          <p className="text-xs text-light-muted dark:text-dark-muted font-medium tracking-widest uppercase mt-0.5">
            An Autonomous Institution
          </p>
          {/* Divider with app name */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-grow h-px bg-light-border dark:bg-dark-border/40" />
            <span className="text-sm font-extrabold tracking-tight text-light-text dark:text-dark-text">
              Campus<span className="text-brand-500">Hub</span>
            </span>
            <div className="flex-grow h-px bg-light-border dark:bg-dark-border/40" />
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted">
            One Platform for Every Campus Need
          </p>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-dark-border/30">
          <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-6">
            Sign In to your Account
          </h2>

          {apiError && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl mb-6 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Email Address
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
                  className="w-full pl-12 pr-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text transition-all"
                  placeholder="name@university.edu"
                />
              </div>
              {errors.email && (
                <span className="text-xs text-red-500 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                  })}
                  className="w-full pl-12 pr-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text transition-all"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-8 pt-6 border-t border-light-border dark:border-dark-border/30 text-center">
            <p className="text-sm text-light-muted dark:text-dark-muted">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
export default Login;
