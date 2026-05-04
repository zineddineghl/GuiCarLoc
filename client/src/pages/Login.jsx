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
      setError(i18n.language.startsWith('fr') ? 'Veuillez remplir tous les champs' : 'Please fill in all fields');
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
    <div className="bg-luxuryBlack min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Grille Subtile (Même que la Home) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(252,209,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(252,209,22,0.02)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        <div className="bg-luxuryDark rounded-3xl p-8 relative overflow-hidden border border-white/5 shadow-2xl">
          
          {/* Lueur dorée en arrière-plan de la carte */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-gnYellow/10 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gnRed/5 blur-[80px] rounded-full pointer-events-none"></div>

          {/* Logo & En-tête */}
          <div className="text-center mb-10 relative z-10">
            <Link to="/" className="inline-block text-5xl mb-4 hover:scale-110 transition-transform duration-300 drop-shadow-md">🚗</Link>
            <h1 className="text-3xl font-display font-black text-white uppercase tracking-widest">{t('auth.login') || 'Connexion'}</h1>
            <p className="text-gnYellow font-bold text-[10px] uppercase tracking-widest mt-2">
              {i18n.language.startsWith('fr') ? 'Accédez à votre espace VIP' : 'Sign in to your VIP account'}
            </p>
          </div>

          {twoFaStep ? (
            /* --- 2FA step --- */
            <form onSubmit={handleVerifyOtp} className="space-y-6 relative z-10">
              <div className="text-center mb-6">
                <div className="text-4xl mb-4 opacity-80">📧</div>
                <p className="text-white font-bold text-sm uppercase tracking-widest">{t('auth.two_fa_title') || 'Code de sécurité'}</p>
                <p className="text-gray-400 text-xs mt-2">{t('auth.two_fa_hint') || 'Consultez votre boîte mail'}</p>
                <p className="text-gray-600 text-[10px] mt-1">⚠️ Vérifiez également vos spams.</p>
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
                  t('auth.verify_code') || 'Vérifier le code'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setTwoFaStep(false); setPendingUserId(null); setOtp(''); setError(''); }}
                className="w-full py-3 text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors border border-white/5 rounded-xl hover:bg-white/5"
              >
                {t('common.back') || 'Retour'}
              </button>
            </form>
          ) : (
            /* --- Login form --- */
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('auth.email') || 'Email'}</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t('auth.email_placeholder') || 'vous@exemple.com'}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('auth.password') || 'Mot de passe'}</label>
                  <Link to="/forgot-password" className="text-[10px] font-bold text-gnYellow hover:text-white uppercase tracking-widest transition-colors">
                    Oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={t('auth.password_placeholder') || '••••••••'}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none pr-12"
                    autoComplete="current-password"
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
              </div>

              {error && (
                <div className="bg-gnRed/10 border border-gnRed/20 text-gnRed rounded-xl p-3 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-xs shadow-[0_0_20px_rgba(252,209,22,0.15)] mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                    {t('common.loading') || 'Connexion...'}
                  </span>
                ) : (
                  t('auth.login') || 'Se connecter'
                )}
              </button>
            </form>
          )}

          {!twoFaStep && (
            <div className="mt-8 pt-6 border-t border-white/5 text-center relative z-10">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {t('auth.no_account') || "Nouveau sur GuiCarLoc ?"}{' '}
                <Link to="/register" className="text-gnYellow hover:text-white transition-colors ml-1">
                  {t('auth.register_link') || "Créer un compte"}
                </Link>
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}