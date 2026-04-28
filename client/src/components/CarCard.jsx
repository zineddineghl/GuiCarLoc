import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPinIcon, UserGroupIcon, CogIcon, BoltIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../App';

const CAR_TYPE_ICONS = {
  sedan: '🚗',
  suv: '🚙',
  van: '🚐',
  sports: '🏎️',
  luxury: '🚘',
  economy: '🚕'
};

const FUEL_ICONS = {
  petrol: '⛽',
  diesel: '🛢️',
  electric: '⚡',
  hybrid: '🔋'
};

export default function CarCard({ car }) {
  const { t } = useTranslation();
  const { user, favIds, toggleFavorite } = useAuth();
  const isFav = favIds.has(car.id);

  const firstImage = car.images && car.images.length > 0
    ? `/uploads/${car.images[0]}`
    : null;

  const typeIcon = CAR_TYPE_ICONS[car.type] || '🚗';
  const fuelIcon = FUEL_ICONS[car.fuel] || '⛽';

  return (
    <Link to={`/cars/${car.id}`} className="card group hover:shadow-md transition-shadow duration-200 block">
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
        {firstImage ? (
          <img
            src={firstImage}
            alt={car.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl opacity-40">{typeIcon}</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-sm">
            {typeIcon} {t(`car.type_${car.type}`)}
          </span>
        </div>

        {/* Available Badge */}
        <div className="absolute top-3 right-3">
          {car.available ? (
            <span className="inline-flex items-center px-2.5 py-1 bg-green-500/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold shadow-sm">
              {t('car.available')}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 bg-red-500/90 backdrop-blur-sm text-white rounded-full text-xs font-semibold shadow-sm">
              {t('car.unavailable')}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        {user && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(car.id); }}
            className="absolute bottom-3 right-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
          >
            {isFav
              ? <HeartSolidIcon className="h-5 w-5 text-red-500" />
              : <HeartIcon className="h-5 w-5 text-gray-400" />
            }
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-primary-700 transition-colors line-clamp-2">
            {car.title}
          </h3>
        </div>

        {car.avg_car_rating ? (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-sm font-semibold text-gray-800">{car.avg_car_rating}</span>
            <span className="text-xs text-gray-400">({car.review_count})</span>
          </div>
        ) : (
          <div className="mb-2" />
        )}

        <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
          <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{car.city}</span>
        </p>

        {/* Car Details */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <UserGroupIcon className="h-3.5 w-3.5" />
            {car.seats} {car.seats === 1 ? t('car.seat') : t('car.seats')}
          </span>
          <span className="flex items-center gap-1">
            <CogIcon className="h-3.5 w-3.5" />
            {t(`car.transmission_${car.transmission}`)}
          </span>
          <span className="flex items-center gap-1">
            <span>{fuelIcon}</span>
            {t(`car.fuel_${car.fuel}`)}
          </span>
          <span className="text-gray-400">
            {car.year}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary-700">
              {car.price_per_day} GNF
            </span>
            <span className="text-sm text-gray-500">{t('car.per_day')}</span>
          </div>
          <span className="text-xs text-gray-400">
            {car.brand} {car.model}
          </span>
        </div>
      </div>
    </Link>
  );
}
