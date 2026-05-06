import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CarCard from '../components/CarCard';
import { AdjustmentsHorizontalIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const CAR_TYPES = [
  { val: 'all', icon: '🚗' },
  { val: 'sedan', icon: '🚗' },
  { val: 'suv', icon: '🚙' },
  { val: 'van', icon: '🚐' },
  { val: 'sports', icon: '🏎️' },
  { val: 'luxury', icon: '🚘' },
  { val: 'compact', icon: '🚕' },
  { val: 'scooter', icon: '🛵' },
  { val: 'moto', icon: '🏍️' }
];

export default function Listings() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'all',
    city: searchParams.get('city') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    transmission: searchParams.get('transmission') || '',
    fuel: searchParams.get('fuel') || '',
    seats: searchParams.get('seats') || ''
  });

  const fetchCars = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') params[k] = v;
      });
      const res = await axios.get('/api/cars', { params });
      setCars(res.data.cars);
    } catch (err) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: 'all', city: '', start_date: '', end_date: '',
      min_price: '', max_price: '', transmission: '', fuel: '', seats: ''
    });
    setSearchParams({});
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all').length;

  return (
    <div className="bg-luxuryBlack min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-display font-black text-white uppercase tracking-tighter mb-2">
              {t('nav.listings')}
            </h1>
            <p className="text-gnYellow font-bold text-xs uppercase tracking-widest opacity-80">
              {loading ? t('common.loading') : `${cars.length} ${cars.length <= 1 ? t('filters.result') : t('filters.results')}`}
            </p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-300 font-bold text-xs uppercase tracking-widest ${
              showFilters || activeFiltersCount > 0
                ? 'bg-gnYellow text-black border-gnYellow shadow-[0_0_20px_rgba(252,209,22,0.3)]'
                : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
            }`}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            {t('filters.title')}
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-black text-gnYellow rounded-full text-[10px]">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide">
          {CAR_TYPES.map(ct => (
            <button
              key={ct.val}
              onClick={() => handleFilterChange('type', ct.val)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                filters.type === ct.val
                  ? 'bg-white text-black border-white shadow-lg'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="mr-2">{ct.icon}</span>
              {t(ct.val === 'all' ? 'car.type_all' : `car.type_${ct.val}`)}
            </button>
          ))}
        </div>

        {/* Filters Panel Expansion */}
        {showFilters && (
          <div className="bg-luxuryDark border border-white/5 p-8 rounded-3xl mb-10 animate-fadeIn">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <MagnifyingGlassIcon className="h-4 w-4 text-gnYellow" />
                Affiner la recherche
              </h2>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="text-[10px] font-black text-gnRed uppercase tracking-widest flex items-center gap-1 hover:opacity-80">
                  <XMarkIcon className="h-3 w-3" /> Effacer tout
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { id: 'city', label: t('home.search_city'), type: 'text', placeholder: 'Ex: Conakry' },
                { id: 'start_date', label: t('home.pickup_date'), type: 'date' },
                { id: 'end_date', label: t('home.return_date'), type: 'date', min: filters.start_date },
                { id: 'min_price', label: 'Prix Min (GNF)', type: 'number' },
                { id: 'max_price', label: 'Prix Max (GNF)', type: 'number' },
              ].map(f => (
                <div key={f.id}>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest">{f.label}</label>
                  <input
                    type={f.type}
                    value={filters[f.id]}
                    min={f.min}
                    placeholder={f.placeholder}
                    onChange={e => handleFilterChange(f.id, e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 transition-colors outline-none"
                  />
                </div>
              ))}

              {/* Selects */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest">Transmission</label>
                <select 
                  value={filters.transmission} 
                  onChange={e => handleFilterChange('transmission', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none appearance-none"
                >
                  <option value="" className="bg-luxuryBlack">Toutes</option>
                  <option value="auto" className="bg-luxuryBlack">Automatique</option>
                  <option value="manual" className="bg-luxuryBlack">Manuelle</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1 tracking-widest">Carburant</label>
                <select 
                  value={filters.fuel} 
                  onChange={e => handleFilterChange('fuel', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none appearance-none"
                >
                  <option value="" className="bg-luxuryBlack">Tous</option>
                  <option value="petrol" className="bg-luxuryBlack">Essence</option>
                  <option value="diesel" className="bg-luxuryBlack">Diesel</option>
                  <option value="electric" className="bg-luxuryBlack">Électrique</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Cars Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white/5 h-[400px] rounded-3xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : cars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {cars.map(car => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white/5 rounded-[40px] border border-white/5 border-dashed">
            <div className="text-6xl mb-6 opacity-40">🔍</div>
            <h3 className="text-2xl font-display font-bold text-white mb-2">{t('home.no_cars')}</h3>
            <p className="text-gray-500 text-sm mb-8">Essayez de modifier vos filtres pour trouver votre perle rare.</p>
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="btn-primary px-10">Réinitialiser</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}