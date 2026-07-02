import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = watch('password');

  const onSubmit = async (data: any) => {
    try {
      setApiError(null);
      setApiSuccess(null);
      setSubmitting(true);

      const response = await api.post(`/auth/reset-password/${token}`, {
        password: data.password,
      });

      setApiSuccess(response.data.message || 'Password updated successfully!');
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Token is invalid or expired. Please request a new link.');
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
        {/* Back to Sign In link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        {/* Glassmorphic Reset Card */}
        <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-dark-border/30">
          <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2">
            Reset Password
          </h2>
          <p className="text-sm text-light-muted dark:text-dark-muted mb-6">
            Enter your new secure password below to update your account access credentials.
          </p>

          {apiError && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl mb-6 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl mb-6 text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{apiSuccess} Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  {...register('password', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="w-full pl-12 pr-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text transition-all"
                  placeholder="•••••••• (Min 6 chars)"
                />
              </div>
              {errors.password && (
                <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-light-muted dark:text-dark-muted">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === watchPassword || 'Passwords do not match',
                  })}
                  className="w-full pl-12 pr-4 py-3 bg-light-bg dark:bg-dark-bg/50 border border-light-border dark:border-dark-border/40 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl outline-none text-sm text-light-text dark:text-dark-text transition-all"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <span className="text-xs text-red-500 mt-1 block">{errors.confirmPassword.message}</span>
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
export default ResetPassword;
