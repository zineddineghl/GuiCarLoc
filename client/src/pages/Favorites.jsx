import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { HeartIcon } from '@heroicons/react/24/outline';
import CarCard from '../components/CarCard';

export default function Favorites() {
  const { t } = useTranslation();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/favorites')
      .then(res => setCars(res.data.cars))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-white/5 rounded-2xl w-1/3 md:w-1/4 border border-white/5"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[400px] bg-white/5 rounded-3xl border border-white/5"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de la page */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gnRed/10 border border-gnRed/20 rounded-2xl">
              <HeartIcon className="h-8 w-8 text-gnRed drop-shadow-[0_0_15px_rgba(255,0,0,0.4)]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter">
                {t('favorites.title') || 'Mes Favoris'}
              </h1>
              <p className="text-gnYellow font-bold text-xs uppercase tracking-widest mt-1 opacity-80">
                {cars.length} {cars.length <= 1 ? 'véhicule sauvegardé' : 'véhicules sauvegardés'}
              </p>
            </div>
          </div>
        </div>

        {/* État vide (Aucun favori) */}
        {cars.length === 0 ? (
          <div className="text-center py-24 bg-luxuryDark rounded-[40px] border border-white/5 border-dashed">
            <div className="text-6xl mb-6 opacity-40 hover:scale-110 transition-transform duration-500 cursor-default">
              🤍
            </div>
            <h3 className="text-2xl font-display font-bold text-white mb-3">
              {t('favorites.empty') || 'Votre liste est vide'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">
              Découvrez notre catalogue exclusif et ajoutez vos véhicules préférés pour les retrouver ici en un clic.
            </p>
            <Link to="/listings" className="btn-primary px-10 py-4 shadow-[0_0_20px_rgba(252,209,22,0.2)]">
              {t('nav.listings') || 'Explorer le catalogue'}
            </Link>
          </div>
        ) : (
          /* Grille des cartes de véhicules (réutilise le style de Listings) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {cars.map(car => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}