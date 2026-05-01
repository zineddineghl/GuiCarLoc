import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
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
            <div className="text-5xl mb-4 opacity-80 hover:scale-110 transition-transform duration-300">🔐</div>
            <h1 className="text-2xl font-display font-black text-white uppercase tracking-widest">
              Mot de passe oublié
            </h1>
            <p className="text-gnYellow font-bold text-[10px] uppercase tracking-widest mt-2">
              Réinitialisation sécurisée
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-6 relative z-10">
              <div className="text-5xl animate-bounce">📧</div>
              <div className="bg-gnGreen/10 border border-gnGreen/20 rounded-xl p-4">
                <p className="text-gnGreen font-black uppercase tracking-widest text-sm mb-2">Email envoyé !</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Si un compte existe avec cet email, vous recevrez un lien de réinitialisation dans quelques minutes.
                </p>
              </div>
              <Link to="/login" className="btn-primary w-full py-4 text-xs shadow-[0_0_20px_rgba(252,209,22,0.15)] flex items-center justify-center">
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <p className="text-gray-400 text-xs text-center leading-relaxed mb-6">
                Entrez l'adresse email associée à votre compte pour recevoir un lien de réinitialisation.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Email de récupération
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="vous@exemple.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none text-center"
                  autoComplete="email"
                  required
                />
              </div>

              {error && (
                <div className="bg-gnRed/10 border border-gnRed/20 text-gnRed rounded-xl p-3 text-xs font-bold text-center uppercase tracking-widest">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="btn-primary w-full py-4 text-xs shadow-[0_0_20px_rgba(252,209,22,0.15)] disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                    Envoi en cours...
                  </span>
                ) : (
                  'Envoyer le lien'
                )}
              </button>

              <div className="pt-4 border-t border-white/5 text-center">
                <Link to="/login" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors">
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}