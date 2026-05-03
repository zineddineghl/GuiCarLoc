import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Vue : Lien Invalide
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 font-sans">
        <div className="bg-[#161616] border border-[#222222] rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-[#FF4444]/10 flex items-center justify-center border border-[#FF4444]/30 mx-auto">
            <span className="text-3xl">❌</span>
          </div>
          <p className="text-[#FF4444] font-bold text-lg">Lien invalide ou expiré.</p>
          <Link 
            to="/forgot-password" 
            className="block w-full bg-[#FFD700] text-[#0A0A0A] font-black tracking-wider uppercase text-sm rounded-xl py-4 hover:bg-yellow-400 transition-colors"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Lien invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-[#161616] border border-[#222222] rounded-3xl p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/20 mx-auto mb-6">
              <span className="text-3xl">🔑</span>
            </div>
            <h1 className="text-xl font-black text-white tracking-widest uppercase mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-[#A0A0A0] text-sm">
              Créez un nouveau mot de passe sécurisé pour votre compte GuiCarLoc.
            </p>
          </div>

          {success ? (
            /* Vue : Succès */
            <div className="text-center space-y-5">
              <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-6">
                <span className="text-5xl block mb-4">✅</span>
                <p className="text-[#10B981] font-bold text-lg mb-1">Mot de passe modifié !</p>
                <p className="text-gray-400 text-sm">Redirection automatique...</p>
              </div>
              <Link 
                to="/login" 
                className="block w-full bg-[#FFD700] text-[#0A0A0A] font-black tracking-wider uppercase text-sm rounded-xl py-4 hover:bg-yellow-400 transition-colors"
              >
                Se connecter
              </Link>
            </div>
          ) : (
            /* Vue : Formulaire */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-[#A0A0A0] text-xs font-bold tracking-wider uppercase ml-1">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Minimum 8 caractères"
                    className="w-full bg-[#0A0A0A] border border-[#222222] text-white rounded-xl p-4 pr-12 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-colors placeholder-[#444444]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-[#FFD700] transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[#A0A0A0] text-xs font-bold tracking-wider uppercase ml-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(''); }}
                    placeholder="Répétez le mot de passe"
                    className="w-full bg-[#0A0A0A] border border-[#222222] text-white rounded-xl p-4 pr-12 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-colors placeholder-[#444444]"
                    required
                  />
                </div>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="bg-[#FF4444]/10 border border-[#FF4444]/30 text-[#FF4444] rounded-xl p-4 text-sm font-semibold text-center">
                  {error}
                </div>
              )}

              {/* Bouton de soumission */}
              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="w-full bg-[#FFD700] text-[#0A0A0A] font-black tracking-wider uppercase text-sm rounded-xl py-4 mt-2 hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0A0A0A]"></span>
                    Mise à jour...
                  </span>
                ) : (
                  'Mettre à jour'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}