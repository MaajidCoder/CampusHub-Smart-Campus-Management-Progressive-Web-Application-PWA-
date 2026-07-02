import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export const ForgotPassword: React.FC = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      setApiError(null);
      setApiSuccess(null);
      setDevToken(null);
      setSubmitting(true);

      const response = await api.post('/auth/forgot-password', { email: data.email });
      setApiSuccess(response.data.message || 'Password reset link sent.');
      
      // In development, the backend returns the raw token in the response
      if (response.data.resetToken) {
        setDevToken(response.data.resetToken);
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Failed to send recovery email. Verify address.');
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
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        {/* Glassmorphic Forgot Password Card */}
        <div className="glass-panel-light dark:glass-panel-dark rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-dark-border/30">
          <h2 className="text-xl font-semibold text-light-text dark:text-dark-text mb-2">
            Recover Password
          </h2>
          <p className="text-sm text-light-muted dark:text-dark-muted mb-6">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          {apiError && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl mb-6 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl mb-6 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{apiSuccess}</span>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Recovery Email</span>
                </>
              )}
            </button>
          </form>

          {/* Dev Token Box (Convenient for local manual tests) */}
          {devToken && (
            <div className="mt-6 p-4 bg-brand-500/10 border border-brand-500/30 rounded-2xl text-xs text-light-text dark:text-dark-text">
              <p className="font-bold mb-1 text-brand-500">Local Testing Helper:</p>
              <p className="mb-2">A reset token was generated. Click below to reset directly:</p>
              <Link
                to={`/reset-password/${devToken}`}
                className="inline-block text-brand-500 hover:underline font-semibold"
              >
                Reset Password for this account &rarr;
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
export default ForgotPassword;
