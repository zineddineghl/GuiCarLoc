import React, { useEffect, useState } from 'react';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <HeartIcon className="h-7 w-7 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">{t('favorites.title')}</h1>
      </div>

      {cars.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🤍</div>
          <p className="text-gray-500 text-lg">{t('favorites.empty')}</p>
          <a href="/listings" className="btn-primary mt-6 inline-block">{t('nav.listings')}</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map(car => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  );
}
