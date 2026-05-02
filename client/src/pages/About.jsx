import React from 'react';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Section 1 : Introduction / Notre Mission */}
        <div className="text-center space-y-6">
          <h1 className="text-3xl md:text-5xl font-display font-black text-white uppercase tracking-tighter">
            À propos de <span className="text-gnYellow">GuiCarLoc</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Notre mission est de révolutionner la location de véhicules en Guinée. 
            Nous croyons en une plateforme simple, sécurisée et transparente, qui connecte 
            les propriétaires de voitures de confiance avec ceux qui cherchent la liberté de se déplacer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Section 2 : L'Instagram Officiel de GuiCarLoc */}
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8 flex flex-col justify-between group hover:bg-white/5 transition-colors">
            <div>
              <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-3">
                L'aventure GuiCarLoc
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Rejoignez notre communauté en ligne ! Suivez-nous sur Instagram pour découvrir 
                les nouveaux véhicules ajoutés, des offres exclusives et les plus belles 
                destinations à explorer avec nos voitures de location.
              </p>
            </div>
            
            <a 
              href="https://instagram.com/guicarloc" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block text-center bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest border border-white/10 py-3 px-6 rounded-xl transition-colors w-full"
            >
              Suivre @guicarloc
            </a>
          </div>

          {/* Section 3 : Le Propriétaire (Saikou) - MAINTENANT AU CENTRE */}
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8 flex flex-col justify-between group hover:bg-white/5 transition-colors">
            <div>
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 overflow-hidden border border-blue-500/20">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
                Saikou Sow
              </h2>
              <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                Propriétaire & Fondateur
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Je mets à disposition 
                des véhicules fiables et bien entretenus pour répondre à tous vos besoins 
                de déplacement en Guinée.
              </p>
            </div>

            {/* Double Bouton : Appel + WhatsApp */}
            <div className="flex flex-col gap-3">
              <a 
                href="https://wa.me/224612471286?text=Bonjour%20Saikou,%20je%20vous%20contacte%20depuis%20le%20site%20GuiCarLoc..." 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white font-bold text-[11px] uppercase tracking-widest border border-[#25D366]/30 py-3 px-4 rounded-xl transition-all w-full group"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
              
              <a 
                href="tel:+224612471286" 
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-blue-500 text-blue-500 hover:text-white font-bold text-[11px] uppercase tracking-widest border border-blue-500/20 py-3 px-4 rounded-xl transition-all w-full group"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Appeler
              </a>
            </div>
          </div>

          {/* Section 4 : Le Développeur (Toi) - MAINTENANT A DROITE */}
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8 flex flex-col justify-between group hover:bg-white/5 transition-colors">
            <div>
              <div className="w-16 h-16 bg-gnYellow/10 rounded-2xl flex items-center justify-center mb-6 overflow-hidden border border-gnYellow/20">
                <svg className="w-8 h-8 text-gnYellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
                Zineddine GHALMI
              </h2>
              <p className="text-gnYellow text-[10px] font-bold uppercase tracking-widest mb-4">
                Développeur Fullstack
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Architecte numérique de la plateforme, 
                je m'assure que la technologie soit au service de votre mobilité. 
              </p>
            </div>

            <a 
              href="https://instagram.com/Zinou.ghl" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block text-center bg-gnYellow text-black hover:brightness-110 font-black text-xs uppercase tracking-widest py-3 px-6 rounded-xl transition-all w-full"
            >
              Voir mon profil @Zinou.ghl
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}