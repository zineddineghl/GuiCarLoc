import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../App';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Register() {
  const { t, i18n } = useTranslation();
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
      setError(i18n.language.startsWith('fr') ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill in all required fields');
      return;
    }
    if (form.password.length < 6) {
      setError(i18n.language.startsWith('fr') ? 'Le mot de passe doit contenir au moins 6 caractères' : 'Password must be at least 6 characters');
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
    <div className="bg-luxuryBlack min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Grille Subtile */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(252,209,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(252,209,22,0.02)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-luxuryDark rounded-3xl p-8 relative overflow-hidden border border-white/5 shadow-2xl">
          
          {/* Lueur dorée en arrière-plan */}
          <div className="absolute -top-20 -left-20 w-48 h-48 bg-gnYellow/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-gnGreen/5 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="text-center mb-8 relative z-10">
            <Link to="/" className="inline-block text-5xl mb-4 hover:scale-110 transition-transform duration-300 drop-shadow-md">🚗</Link>
            <h1 className="text-3xl font-display font-black text-white uppercase tracking-widest">
              {verifyStep ? (t('auth.verify_email_title') || 'Vérification') : (t('auth.register') || 'Inscription')}
            </h1>
            <p className="text-gnYellow font-bold text-[10px] uppercase tracking-widest mt-2">
              {verifyStep
                ? (t('auth.verify_email_hint') || 'Consultez vos emails')
                : (i18n.language.startsWith('fr') ? 'Créez votre compte VIP' : 'Create your VIP account')}
            </p>
          </div>

          {verifyStep ? (
            /* --- Email verification step --- */
            <form onSubmit={handleVerifyEmail} className="space-y-6 relative z-10">
              <div className="text-center mb-4">
                <div className="text-4xl mb-4 opacity-80">📧</div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{form.email}</p>
              </div>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-3xl tracking-[0.5em] font-black focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none"
                placeholder="000000"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                autoFocus
              />

              {error && (
                <div className="bg-gnRed/10 border border-gnRed/20 text-gnRed rounded-xl p-3 text-xs font-bold text-center uppercase tracking-widest">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="btn-primary w-full py-4 text-xs shadow-[0_0_20px_rgba(252,209,22,0.15)] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                    {t('common.loading') || 'Vérification...'}
                  </span>
                ) : (
                  t('auth.verify_code') || 'Valider'
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-[10px] font-bold uppercase tracking-widest text-gnYellow hover:text-white transition-colors disabled:text-gray-600"
                >
                  {resendCooldown > 0
                    ? `${t('auth.resend_code') || 'Renvoyer'} (${resendCooldown}s)`
                    : (t('auth.resend_code') || 'Renvoyer le code')}
                </button>
              </div>
            </form>
          ) : (
            /* --- Registration form --- */
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              
              {/* Role Selection (Propriétaire/Locataire) - Refondu Luxe */}
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">{t('auth.role') || 'Vous souhaitez ?'} *</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { value: 'renter', label: t('auth.role_renter') || 'Louer une voiture', icon: '🔍' },
                    { value: 'owner', label: t('auth.role_owner') || 'Mettre en location', icon: '🚗' },
                    { value: 'both', label: t('auth.role_both') || 'Faire les deux', icon: '✨' }
                  ].map(r => (
                    <label
                      key={r.value}
                      className={`relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        form.role === r.value
                          ? 'border-gnYellow bg-gnYellow/10 text-white shadow-[0_0_15px_rgba(252,209,22,0.1)]'
                          : 'border-white/10 hover:border-white/20 text-gray-400 bg-black/20 hover:bg-black/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={form.role === r.value}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {/* Custom Radio Button */}
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${form.role === r.value ? 'border-gnYellow' : 'border-gray-500'}`}>
                        {form.role === r.value && <div className="w-2 h-2 bg-gnYellow rounded-full" />}
                      </div>
                      <span className="text-2xl drop-shadow-md">{r.icon}</span>
                      <span className="text-[11px] font-bold uppercase tracking-widest">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('auth.name') || 'Nom complet'} *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={t('auth.name_placeholder') || 'Ex: Amadou Diallo'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none"
                  autoComplete="name"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('auth.email') || 'Email'} *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('auth.email_placeholder') || 'vous@exemple.com'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('auth.password') || 'Mot de passe'} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={t('auth.password_placeholder') || '••••••••'}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none pr-12"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gnYellow transition-colors rounded-lg hover:bg-white/5"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-2 ml-1">
                  {i18n.language.startsWith('fr') ? 'Minimum 6 caractères' : 'Minimum 6 characters'}
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  {t('auth.phone') || 'Téléphone'} <span className="text-gray-600 font-normal lowercase italic">({t('common.optional') || 'optionnel'})</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={t('auth.phone_placeholder') || '+224 ...'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none"
                  autoComplete="tel"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="bg-gnRed/10 border border-gnRed/20 text-gnRed rounded-xl p-3 text-xs font-bold text-center uppercase tracking-widest">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-xs shadow-[0_0_20px_rgba(252,209,22,0.15)] mt-4 disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                    {t('common.loading') || 'Création...'}
                  </span>
                ) : (
                  t('auth.register') || "S'inscrire"
                )}
              </button>
            </form>
          )}

          {!verifyStep && (
            <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {t('auth.already_account') || 'Déjà un compte ?'}{' '}
                <Link to="/login" className="text-gnYellow hover:text-white transition-colors ml-1">
                  {t('auth.login_link') || 'Se connecter'}
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}