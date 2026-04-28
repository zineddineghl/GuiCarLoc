import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const CAR_TYPE_ICONS = {
  sedan: '🚗', suv: '🚙', van: '🚐', sports: '🏎️', luxury: '🚘', economy: '🚕'
};

export default function MyListings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchListings = () => {
    setLoading(true);
    axios.get('/api/cars/my/listings')
      .then(res => setCars(res.data.cars))
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDelete = async (carId, title) => {
    const msg = i18n.language === 'fr'
      ? `Supprimer "${title}" ? Cette action est irréversible.`
      : `Delete "${title}"? This cannot be undone.`;
    if (!window.confirm(msg)) return;

    setDeletingId(carId);
    try {
      await axios.delete(`/api/cars/${carId}`);
      setCars(prev => prev.filter(c => c.id !== carId));
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailability = async (car) => {
    try {
      const formData = new FormData();
      formData.append('available', car.available ? 'false' : 'true');
      const res = await axios.put(`/api/cars/${car.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCars(prev => prev.map(c => c.id === car.id ? { ...c, available: res.data.car.available } : c));
    } catch (err) {
      setError(t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-32 bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('listing.my_listings_title')}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {cars.length} {t('listing.listings_count')}
          </p>
        </div>
        <Link to="/post-listing" className="btn-primary flex items-center gap-2">
          <PlusCircleIcon className="h-5 w-5" />
          {t('listing.add_listing')}
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {cars.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🚗</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('listing.no_listings')}</h3>
          <p className="text-gray-500 mb-6">
            {t('listing.post_first')}
          </p>
          <Link to="/post-listing" className="btn-primary">
            {t('listing.add_listing')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {cars.map(car => {
            const typeIcon = CAR_TYPE_ICONS[car.type] || '🚗';
            const firstImage = car.images && car.images.length > 0 ? car.images[0] : null;

            return (
              <div key={car.id} className="card p-5 flex flex-col sm:flex-row gap-4">
                {/* Image */}
                <Link to={`/cars/${car.id}`} className="flex-shrink-0">
                  <div className="w-full sm:w-32 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    {firstImage ? (
                      <img
                        src={`/uploads/${firstImage}`}
                        alt={car.title}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-4xl opacity-40">{typeIcon}</span>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 mb-1">
                    <Link to={`/cars/${car.id}`} className="font-bold text-gray-900 hover:text-primary-700 transition-colors line-clamp-1">
                      {car.title}
                    </Link>
                    {car.available ? (
                      <span className="badge-confirmed flex items-center gap-1">
                        <CheckCircleIcon className="h-3 w-3" />
                        {t('car.available')}
                      </span>
                    ) : (
                      <span className="badge-rejected flex items-center gap-1">
                        <XCircleIcon className="h-3 w-3" />
                        {t('car.unavailable')}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                    <MapPinIcon className="h-3.5 w-3.5" />
                    {car.city} · {car.brand} {car.model} {car.year}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="font-bold text-primary-700">{car.price_per_day} GNF{t('car.per_day')}</span>
                    <span className="text-gray-500">
                      {car.total_bookings || 0} {t('listing.bookings_count')}
                      {car.pending_bookings > 0 && (
                        <span className="ml-1 text-orange-600 font-semibold">
                          ({car.pending_bookings} {t('listing.pending_count')})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 sm:items-end justify-end">
                  <button
                    onClick={() => handleToggleAvailability(car)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      car.available
                        ? 'border-orange-300 text-orange-700 hover:bg-orange-50'
                        : 'border-green-300 text-green-700 hover:bg-green-50'
                    }`}
                  >
                    {car.available ? t('listing.deactivate') : t('listing.activate')}
                  </button>

                  <Link
                    to={`/edit-listing/${car.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary-300 text-primary-700 hover:bg-primary-50 transition-colors"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    {t('common.edit')}
                  </Link>

                  <button
                    onClick={() => handleDelete(car.id, car.title)}
                    disabled={deletingId === car.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    {deletingId === car.id ? '...' : t('common.delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
