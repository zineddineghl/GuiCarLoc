import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../App';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const { t, i18n } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA step
  const [twoFaStep, setTwoFaStep] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [otp, setOtp] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', form);
      if (res.data.requires_2fa) {
        setPendingUserId(res.data.userId);
        setTwoFaStep(true);
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

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/verify-2fa', { userId: pendingUserId, code: otp });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* La classe .card gère déjà le fond sombre grâce à notre index.css */}
        <div className="card p-8 relative overflow-hidden">
          
          {/* Petit effet de lueur dorée en arrière-plan de la carte */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gnYellow/10 blur-3xl rounded-full pointer-events-none"></div>

          {/* Logo & En-tête */}
          <div className="text-center mb-8 relative z-10">
            <div className="text-5xl mb-3">🚗</div>
            {/* Titre en blanc avec la police Luxe */}
            <h1 className="text-3xl font-display font-bold text-white tracking-wide">{t('auth.login')}</h1>
            <p className="text-gray-400 text-sm mt-2">
              {i18n.language === 'fr' ? 'Connectez-vous à votre compte' : 'Sign in to your account'}
            </p>
          </div>

          {twoFaStep ? (
            /* --- 2FA step --- */
            <form onSubmit={handleVerifyOtp} className="space-y-5 relative z-10">
              <div className="text-center mb-4">
                <div className="text-4xl mb-3">📧</div>
                <p className="text-white font-medium">{t('auth.two_fa_title')}</p>
                <p className="text-gray-400 text-sm mt-1">{t('auth.two_fa_hint')}</p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                /* input-field est déjà adapté au mode sombre dans index.css */
                className="input-field text-center text-3xl tracking-[0.5em] font-bold"
                placeholder="000000"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                autoFocus
              />

              {error && (
                /* Alerte d'erreur adaptée au mode sombre */
                <div className="bg-gnRed/10 border border-gnRed/20 text-red-400 rounded-lg p-3 text-sm text-center">
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
                    {/* Spinner noir pour contraster avec le bouton jaune */}
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.verify_code')
                )}
              </button>

              <button
                type="button"
                onClick={() => { setTwoFaStep(false); setPendingUserId(null); setOtp(''); setError(''); }}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors"
              >
                {t('common.back')}
              </button>
            </form>
          ) : (
            /* --- Login form --- */
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="form-group">
                <label className="form-label">{t('auth.email')}</label>
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

              <div className="form-group">
                <label className="form-label">{t('auth.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={t('auth.password_placeholder')}
                    className="input-field pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-gnYellow hover:text-white transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>

              {error && (
                <div className="bg-gnRed/10 border border-gnRed/20 text-red-400 rounded-lg p-3 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    {/* Spinner noir pour contraster avec le bouton jaune */}
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                    {t('common.loading')}
                  </span>
                ) : (
                  t('auth.login')
                )}
              </button>
            </form>
          )}

          {!twoFaStep && (
            <p className="text-center text-sm text-gray-400 mt-8 relative z-10">
              {t('auth.no_account')}{' '}
              <Link to="/register" className="text-gnYellow font-bold hover:text-white transition-colors tracking-wide">
                {t('auth.register_link')}
              </Link>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}