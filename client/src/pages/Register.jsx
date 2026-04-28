import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../App';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Register() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'renter'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email verification step
  const [verifyStep, setVerifyStep] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/register', form);
      if (res.data.requires_verification) {
        setPendingUserId(res.data.userId);
        setVerifyStep(true);
        return;
      }
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/verify-email', { userId: pendingUserId, code: otp });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await axios.post('/api/auth/resend-verify', { userId: pendingUserId });
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // silent
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🚗</div>
            <h1 className="text-2xl font-bold text-gray-900">
              {verifyStep ? t('auth.verify_email_title') : t('auth.register')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {verifyStep
                ? t('auth.verify_email_hint')
                : (t('i18n.language') === 'fr' ? 'Créez votre compte gratuitement' : 'Create your free account')}
            </p>
          </div>

          {verifyStep ? (
            /* --- Email verification step --- */
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-4xl mb-3">📧</div>
                <p className="text-gray-600 text-sm">{form.email}</p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="input-field text-center text-3xl tracking-[0.5em] font-bold"
                placeholder="000000"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                autoFocus
              />

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.verify_code')
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sm text-primary-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  {resendCooldown > 0
                    ? `${t('auth.resend_code')} (${resendCooldown}s)`
                    : t('auth.resend_code')}
                </button>
              </div>
            </form>
          ) : (
            /* --- Registration form --- */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="form-group">
                <label className="form-label">{t('auth.name')} *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t('auth.name_placeholder')}
                  className="input-field"
                  autoComplete="name"
                  required
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">{t('auth.email')} *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('auth.email_placeholder')}
                  className="input-field"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">{t('auth.password')} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={t('auth.password_placeholder')}
                    className="input-field pr-10"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {t('i18n.language') === 'fr' ? 'Minimum 6 caractères' : 'Minimum 6 characters'}
                </p>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">
                  {t('auth.phone')} <span className="text-gray-400 font-normal">({t('common.optional')})</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={t('auth.phone_placeholder')}
                  className="input-field"
                  autoComplete="tel"
                />
              </div>

              {/* Role */}
              <div className="form-group">
                <label className="form-label">{t('auth.role')} *</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: 'renter', label: t('auth.role_renter'), icon: '🔍' },
                    { value: 'owner', label: t('auth.role_owner'), icon: '🚗' },
                    { value: 'both', label: t('auth.role_both'), icon: '✨' }
                  ].map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        form.role === r.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={form.role === r.value}
                        onChange={handleChange}
                        className="accent-primary-600"
                      />
                      <span className="text-lg">{r.icon}</span>
                      <span className="text-sm font-medium text-gray-700">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.register')
                )}
              </button>
            </form>
          )}

          {!verifyStep && (
            <p className="text-center text-sm text-gray-500 mt-6">
              {t('auth.already_account')}{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                {t('auth.login_link')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
