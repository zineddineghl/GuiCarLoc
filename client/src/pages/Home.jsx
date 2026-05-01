import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import CarCard from '../components/CarCard';
import { ShieldCheckIcon, BanknotesIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const { t, i18n } = useTranslation();
  const [featuredCars, setFeaturedCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/cars')
      .then(res => {
        setFeaturedCars(res.data.cars.slice(0, 6));
      })
      .catch(err => console.error('Error loading cars:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    // Le conteneur principal passe en mode sombre (luxuryBlack)
    <div className="bg-luxuryBlack min-h-screen text-white font-sans overflow-hidden">
      
      {/* ══ HERO SECTION ══ */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28">
        {/* Background Grille Subtile */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(252,209,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(252,209,22,0.03)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-4xl mx-auto">
            {/* Ligne "Conakry Guinée Excellence" */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-[1px] bg-gnYellow"></div>
              <span className="text-gnYellow text-xs md:text-sm font-bold tracking-[0.2em] uppercase">
                Conakry · Guinée · Excellence
              </span>
              <div className="w-12 h-[1px] bg-gnYellow"></div>
            </div>

            {/* Nouveau Titre Accrocheur */}
            <h1 className="text-5xl md:text-7xl font-display font-black leading-[1.1] tracking-tight mb-6">
              Ta voiture dort<br />
              le <span className="text-gnYellow">week-end ?</span><br />
              Mets-la à <span className="text-gnGreen">disposition.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 font-bold max-w-2xl mx-auto leading-relaxed">
              Gagne de l'argent avec GuiCarLoc !
            </p>
          </div>

          {/* Search Box - Adaptée au mode sombre (Effet Glassmorphism) */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 max-w-5xl mx-auto shadow-2xl relative z-10">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* ══ FEATURED CARS ══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="section-label-tag">{i18n.language === 'fr' ? 'Annonces récentes' : 'Recent listings'}</div>
            <h2 className="section-title">{t('home.featured_title')}</h2>
            <div className="triline">
              <span className="t-red" />
              <span className="t-yellow" />
              <span className="t-green" />
            </div>
          </div>
          <Link to="/listings" className="btn-secondary btn-sm hidden sm:inline-flex">
            {t('home.view_all')}
          </Link>
        </div>

        {loading ? (
          /* Squelettes de chargement adaptés au mode sombre */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-luxuryDark rounded-2xl border border-white/5 animate-pulse overflow-hidden">
                <div className="h-48 bg-white/5"></div>
                <div className="p-6 space-y-4">
                  <div className="h-5 bg-white/5 rounded w-3/4"></div>
                  <div className="h-4 bg-white/5 rounded w-1/2"></div>
                  <div className="h-4 bg-white/5 rounded w-2/3"></div>
                  <div className="h-10 bg-white/5 rounded w-full mt-6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : featuredCars.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCars.map(car => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link to="/listings" className="btn-primary">
                {t('home.view_all')}
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-luxuryDark rounded-2xl border border-white/5">
            <div className="text-6xl mb-6">🚗</div>
            <p className="text-gray-400 text-lg mb-6">{t('home.no_cars')}</p>
            <Link to="/post-listing" className="btn-primary">
              {t('nav.post_listing')}
            </Link>
          </div>
        )}
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="bg-luxuryDark border-y border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="section-label-tag justify-center">{i18n.language === 'fr' ? 'Simple & rapide' : 'Simple & fast'}</div>
            <h2 className="section-title">{t('home.how_it_works')}</h2>
            <div className="triline justify-center">
              <span className="t-red" />
              <span className="t-yellow" />
              <span className="t-green" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: 1, icon: '🔍', title: t('home.step1_title'), desc: t('home.step1_desc') },
              { step: 2, icon: '📋', title: t('home.step2_title'), desc: t('home.step2_desc') },
              { step: 3, icon: '🚗', title: t('home.step3_title'), desc: t('home.step3_desc') }
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  {/* Cercles adaptés avec la couleur jaune (gnYellow) */}
                  <div className="w-20 h-20 bg-gnYellow/10 rounded-2xl flex items-center justify-center text-4xl border border-gnYellow/20">
                    {icon}
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gnYellow text-black rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 font-display">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY US ══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <div className="section-label-tag justify-center">{i18n.language === 'fr' ? 'Nos avantages' : 'Our advantages'}</div>
          <h2 className="section-title">{t('home.why_us')}</h2>
          <div className="triline justify-center">
            <span className="t-red" />
            <span className="t-yellow" />
            <span className="t-green" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-gnRed/50 hover:bg-white/10 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{background:'rgba(206,17,38,0.15)'}}>
              <ShieldCheckIcon className="h-8 w-8 text-gnRed" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-display">{t('home.benefit1_title')}</h3>
            <p className="text-gray-400 leading-relaxed">{t('home.benefit1_desc')}</p>
          </div>
          <div className="flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-gnYellow/50 hover:bg-white/10 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{background:'rgba(252,209,22,0.15)'}}>
              <BanknotesIcon className="h-8 w-8 text-gnYellow" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-display">{t('home.benefit2_title')}</h3>
            <p className="text-gray-400 leading-relaxed">{t('home.benefit2_desc')}</p>
          </div>
          <div className="flex flex-col items-center text-center p-8 bg-white/5 rounded-2xl border border-white/10 hover:border-gnGreen/50 hover:bg-white/10 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{background:'rgba(0,148,96,0.15)'}}>
              <ClockIcon className="h-8 w-8 text-gnGreen" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-display">{t('home.benefit3_title')}</h3>
            <p className="text-gray-400 leading-relaxed">{t('home.benefit3_desc')}</p>
          </div>
        </div>
      </section>

      {/* ══ CTA SECTION ══ */}
      {/* On utilise le jaune pour créer un fort contraste à la fin de la page */}
      <section className="bg-gnYellow text-black py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.05)_0%,transparent_70%)]"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-display font-black mb-6 leading-tight">
            {i18n.language === 'fr'
              ? 'Vous avez une voiture à louer ?'
              : 'Have a car to rent out?'}
          </h2>
          <p className="text-black/80 text-lg md:text-xl mb-10 font-medium">
            {i18n.language === 'fr'
              ? "Publiez votre annonce gratuitement et commencez à générer des revenus."
              : 'Post your listing for free and start earning money.'}
          </p>
          <Link to="/post-listing" className="inline-flex items-center gap-3 px-10 py-4 bg-luxuryBlack text-white font-bold rounded-xl hover:bg-luxuryDark hover:-translate-y-1 transition-all duration-300 text-lg shadow-2xl">
            <span>🚗</span> {t('nav.post_listing')}
          </Link>
        </div>
      </section>

    </div>
  );
}