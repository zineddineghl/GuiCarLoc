import React from 'react';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
      {/* J'ai élargi le conteneur (max-w-6xl au lieu de 4xl) pour que les 3 blocs respirent */}
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

        {/* La grille passe à 3 colonnes sur ordinateur (md:grid-cols-3) */}
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
              href="https://instagram.com/guicarloc224" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block text-center bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest border border-white/10 py-3 px-6 rounded-xl transition-colors w-full"
            >
              Suivre @guicarloc
            </a>
          </div>

          {/* Section 3 : Le Développeur (Toi) */}
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8 flex flex-col justify-between group hover:bg-white/5 transition-colors">
            <div>
              <div className="w-16 h-16 bg-gnYellow/10 rounded-2xl flex items-center justify-center mb-6 overflow-hidden border border-gnYellow/20">
                <svg className="w-8 h-8 text-gnYellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
                Zineddine
              </h2>
              <p className="text-gnYellow text-[10px] font-bold uppercase tracking-widest mb-4">
                Fondateur & Développeur Fullstack
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

          {/* Section 4 : Le Propriétaire (Saikou) */}
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8 flex flex-col justify-between group hover:bg-white/5 transition-colors">
            <div>
              {/* Icône et couleurs personnalisées pour le propriétaire */}
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 overflow-hidden border border-blue-500/20">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
                Saikou Sow
              </h2>
              <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                Propriétaire
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Je mets à disposition 
                des véhicules fiables et bien entretenus pour répondre à tous vos besoins 
                de déplacement en Guinée.
              </p>
            </div>

            {/* Le lien "tel:" permet d'appeler directement depuis un smartphone */}
            <a 
              href="tel:+224612471286" 
              className="inline-block text-center bg-white/5 hover:bg-blue-500 hover:text-white text-blue-500 font-bold text-[11px] uppercase tracking-widest border border-blue-500/20 hover:border-blue-500 py-3 px-6 rounded-xl transition-all w-full"
            >
              Appeler le +224 612 47 12 86
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}