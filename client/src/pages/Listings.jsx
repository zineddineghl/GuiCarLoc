import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import CarCard from '../components/CarCard';
import SearchBar from '../components/SearchBar';
import { AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CAR_TYPES = ['all', 'sedan', 'suv', 'van', 'sports', 'luxury', 'economy'];
const TRANSMISSIONS = ['', 'auto', 'manual'];
const FUELS = ['', 'petrol', 'diesel', 'electric', 'hybrid'];

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
      type: 'all',
      city: '',
      start_date: '',
      end_date: '',
      min_price: '',
      max_price: '',
      transmission: '',
      fuel: '',
      seats: ''
    });
    setSearchParams({});
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => v && v !== 'all'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.listings')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? t('common.loading') : `${cars.length} ${cars.length === 1 ? t('filters.result') : t('filters.results')}`}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-primary-600 text-white border-primary-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          {t('filters.title')}
          {hasActiveFilters && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 bg-white text-primary-700 rounded-full text-xs font-bold">
              {Object.values(filters).filter(v => v && v !== 'all').length}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{t('filters.title')}</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                <XMarkIcon className="h-4 w-4" />
                {t('filters.clear')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Type */}
            <div>
              <label className="form-label">{t('home.search_type')}</label>
              <select
                value={filters.type}
                onChange={e => handleFilterChange('type', e.target.value)}
                className="input-field text-sm py-2"
              >
                {CAR_TYPES.map(type => (
                  <option key={type} value={type}>
                    {t(`car.type_${type === 'all' ? 'all' : type}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="form-label">{t('home.search_city')}</label>
              <input
                type="text"
                value={filters.city}
                onChange={e => handleFilterChange('city', e.target.value)}
                placeholder={t('home.search_city_placeholder')}
                className="input-field text-sm py-2"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="form-label">{t('home.pickup_date')}</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={e => handleFilterChange('start_date', e.target.value)}
                className="input-field text-sm py-2"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="form-label">{t('home.return_date')}</label>
              <input
                type="date"
                value={filters.end_date}
                min={filters.start_date}
                onChange={e => handleFilterChange('end_date', e.target.value)}
                className="input-field text-sm py-2"
              />
            </div>

            {/* Min Price */}
            <div>
              <label className="form-label">{t('filters.min_price')} (€)</label>
              <input
                type="number"
                value={filters.min_price}
                onChange={e => handleFilterChange('min_price', e.target.value)}
                min="0"
                placeholder="0"
                className="input-field text-sm py-2"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="form-label">{t('filters.max_price')} (€)</label>
              <input
                type="number"
                value={filters.max_price}
                onChange={e => handleFilterChange('max_price', e.target.value)}
                min="0"
                placeholder="500"
                className="input-field text-sm py-2"
              />
            </div>

            {/* Transmission */}
            <div>
              <label className="form-label">{t('filters.transmission')}</label>
              <select
                value={filters.transmission}
                onChange={e => handleFilterChange('transmission', e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="">{t('filters.any')}</option>
                <option value="auto">{t('car.transmission_auto')}</option>
                <option value="manual">{t('car.transmission_manual')}</option>
              </select>
            </div>

            {/* Fuel */}
            <div>
              <label className="form-label">{t('filters.fuel')}</label>
              <select
                value={filters.fuel}
                onChange={e => handleFilterChange('fuel', e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="">{t('filters.any')}</option>
                <option value="petrol">{t('car.fuel_petrol')}</option>
                <option value="diesel">{t('car.fuel_diesel')}</option>
                <option value="electric">{t('car.fuel_electric')}</option>
                <option value="hybrid">{t('car.fuel_hybrid')}</option>
              </select>
            </div>

            {/* Min Seats */}
            <div>
              <label className="form-label">{t('filters.seats')}</label>
              <input
                type="number"
                value={filters.seats}
                onChange={e => handleFilterChange('seats', e.target.value)}
                min="1"
                max="9"
                placeholder="2"
                className="input-field text-sm py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Car Type Quick Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {CAR_TYPES.map(type => (
          <button
            key={type}
            onClick={() => handleFilterChange('type', type)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filters.type === type
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-700'
            }`}
          >
            {type === 'sedan' ? '🚗' : type === 'suv' ? '🚙' : type === 'van' ? '🚐' : type === 'sports' ? '🏎️' : type === 'luxury' ? '🚘' : type === 'economy' ? '🚕' : '🚗'}{' '}
            {t(type === 'all' ? 'car.type_all' : `car.type_${type}`)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Cars Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-44 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : cars.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cars.map(car => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('home.no_cars')}
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-primary mt-4"
            >
              {t('filters.clear')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
