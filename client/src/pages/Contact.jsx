import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await axios.post('/api/contact', formData);
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      setStatus('error');
    }
  };

  return (
    <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter mb-4">
            Nous contacter
          </h1>
          <p className="text-gray-400 text-sm">
            Une question sur une location ? Un problème technique ? Notre équipe est là pour vous aider.
          </p>
        </div>

        <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8 md:p-10">
          {status === 'success' ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gnGreen/10 text-gnGreen rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
              <h2 className="text-white font-bold text-xl mb-2">Message envoyé !</h2>
              <p className="text-gray-400">Nous avons bien reçu votre demande. Notre équipe vous répondra dans les plus brefs délais.</p>
              <button 
                onClick={() => setStatus('idle')} 
                className="mt-8 text-gnYellow hover:text-white transition-colors text-sm font-bold uppercase tracking-widest border border-white/10 px-6 py-2 rounded-lg hover:bg-white/5"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nom complet</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gnYellow transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Adresse Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gnYellow transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sujet</label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gnYellow transition-colors"
                  placeholder="Ex: Problème avec ma réservation"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>
                <textarea 
                  required 
                  rows="5"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gnYellow transition-colors resize-none"
                  placeholder="Comment pouvons-nous vous aider ?"
                ></textarea>
              </div>

              {status === 'error' && (
                <p className="text-gnRed text-sm font-bold bg-gnRed/10 p-3 rounded-lg border border-gnRed/20">
                  Une erreur est survenue lors de l'envoi. Veuillez réessayer.
                </p>
              )}

              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full bg-gnYellow text-black font-black uppercase tracking-widest py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}