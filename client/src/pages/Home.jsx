import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import CarCard from '../components/CarCard';
import { ShieldCheckIcon, CurrencyEuroIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const { t } = useTranslation();
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
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <div className="text-center mb-10">
            <div className="text-6xl mb-4">🚗</div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
              {t('home.hero_title')}
            </h1>
            <p className="text-lg md:text-xl text-primary-200 max-w-2xl mx-auto">
              {t('home.hero_subtitle')}
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 md:p-8 max-w-5xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="py-5 text-center">
              <div className="text-2xl font-bold text-primary-700">500+</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {t('i18n.language') === 'fr' ? 'Voitures disponibles' : 'Available cars'}
              </div>
            </div>
            <div className="py-5 text-center">
              <div className="text-2xl font-bold text-primary-700">50+</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {t('i18n.language') === 'fr' ? 'Villes couvertes' : 'Cities covered'}
              </div>
            </div>
            <div className="py-5 text-center">
              <div className="text-2xl font-bold text-primary-700">1000+</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {t('i18n.language') === 'fr' ? 'Clients satisfaits' : 'Happy customers'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-title">{t('home.featured_title')}</h2>
            <p className="text-gray-500 mt-1">{t('home.featured_subtitle')}</p>
          </div>
          <Link to="/listings" className="btn-secondary btn-sm hidden sm:inline-flex">
            {t('home.view_all')}
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3 mt-4"></div>
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
            <div className="text-center mt-10">
              <Link to="/listings" className="btn-primary">
                {t('home.view_all')}
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🚗</div>
            <p className="text-gray-500 text-lg">{t('home.no_cars')}</p>
            <Link to="/post-listing" className="btn-primary mt-4 inline-block">
              {t('nav.post_listing')}
            </Link>
          </div>
        )}
      </section>

      {/* How It Works */}
      <section className="bg-primary-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-12">{t('home.how_it_works')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, icon: '🔍', title: t('home.step1_title'), desc: t('home.step1_desc') },
              { step: 2, icon: '📋', title: t('home.step2_title'), desc: t('home.step2_desc') },
              { step: 3, icon: '🚗', title: t('home.step3_title'), desc: t('home.step3_desc') }
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-3xl shadow-lg">
                    {icon}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white border-2 border-primary-600 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                    {step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="section-title text-center mb-12">{t('home.why_us')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-primary-50 transition-colors">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.benefit1_title')}</h3>
            <p className="text-gray-600">{t('home.benefit1_desc')}</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-primary-50 transition-colors">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <CurrencyEuroIcon className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.benefit2_title')}</h3>
            <p className="text-gray-600">{t('home.benefit2_desc')}</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-primary-50 transition-colors">
            <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <ClockIcon className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.benefit3_title')}</h3>
            <p className="text-gray-600">{t('home.benefit3_desc')}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('i18n.language') === 'fr'
              ? 'Vous avez une voiture à louer ?'
              : 'Have a car to rent out?'}
          </h2>
          <p className="text-primary-200 text-lg mb-8">
            {t('i18n.language') === 'fr'
              ? 'Publiez votre annonce gratuitement et commencez à gagner de l\'argent.'
              : 'Post your listing for free and start earning money.'}
          </p>
          <Link to="/post-listing" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors text-lg shadow-lg">
            🚗 {t('nav.post_listing')}
          </Link>
        </div>
      </section>
    </div>
  );
}
