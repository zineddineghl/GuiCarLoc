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
  compact: '🚕',
  scooter: '🛵',
  moto: '🏍️'
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
    ? (car.images[0].startsWith('http') ? car.images[0] : `/uploads/${car.images[0]}`)
    : null;

  const typeIcon = CAR_TYPE_ICONS[car.type] || '🚗';
  const fuelIcon = FUEL_ICONS[car.fuel] || '⛽';

  return (
    <Link to={`/cars/${car.id}`} className="card group hover:shadow-[0_0_20px_rgba(252,209,22,0.1)] transition-all duration-300 block border border-white/5 overflow-hidden">
      {/* Image Section */}
      <div className="relative h-48 bg-luxuryDark overflow-hidden">
        {firstImage ? (
          <img
            src={firstImage}
            alt={car.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <span className="text-7xl opacity-20">{typeIcon}</span>
          </div>
        )}

        {/* Overlay Dégradé pour l'image */}
        <div className="absolute inset-0 bg-gradient-to-t from-luxuryBlack/60 to-transparent" />

        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
            {typeIcon} {t(`car.type_${car.type}`)}
          </span>
        </div>

        {/* Available Badge */}
        <div className="absolute top-3 right-3">
          {car.available ? (
            <span className="inline-flex items-center px-3 py-1 bg-gnGreen text-white rounded-full text-[10px] font-bold shadow-lg uppercase tracking-wider">
              {t('car.available')}
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 bg-gnRed text-white rounded-full text-[10px] font-bold shadow-lg uppercase tracking-wider">
              {t('car.unavailable')}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        {user && (
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavorite(car.id); }}
            className="absolute bottom-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg hover:bg-white transition-all duration-300 group/fav"
          >
            {isFav
              ? <HeartSolidIcon className="h-5 w-5 text-gnRed animate-pulse" />
              : <HeartIcon className="h-5 w-5 text-white group-hover/fav:text-gnRed transition-colors" />
            }
          </button>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5">
        <div className="mb-2">
          <h3 className="font-display font-bold text-white text-lg leading-tight group-hover:text-gnYellow transition-colors line-clamp-1">
            {car.title}
          </h3>
          
          {/* Brand & Model - Texte discret */}
          <p className="text-[10px] text-gnYellow font-bold uppercase tracking-[0.2em] mt-1 opacity-80">
             {car.brand} {car.model}
          </p>
        </div>

        {/* Rating */}
        {car.avg_car_rating ? (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-gnYellow text-sm">★</span>
            <span className="text-sm font-bold text-gray-200">{car.avg_car_rating}</span>
            <span className="text-xs text-gray-500">({car.review_count})</span>
          </div>
        ) : (
          <div className="mb-3 h-5" /> 
        )}

        {/* City - Correction du contraste ici */}
        <p className="text-sm text-gray-400 mb-4 flex items-center gap-1.5 font-medium">
          <MapPinIcon className="h-4 w-4 text-gnYellow/70 flex-shrink-0" />
          <span className="truncate">{car.city}{car.neighborhood ? ` · ${car.neighborhood}` : ''}</span>
        </p>

        {/* Car Details - Icônes et textes plus clairs */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-300 mb-5 py-3 border-y border-white/5">
          <span className="flex items-center gap-1.5 hover:text-white transition-colors">
            <UserGroupIcon className="h-4 w-4 text-gray-500" />
            {car.seats} {car.seats === 1 ? t('car.seat') : t('car.seats')}
          </span>
          <span className="flex items-center gap-1.5 hover:text-white transition-colors">
            <CogIcon className="h-4 w-4 text-gray-500" />
            {t(`car.transmission_${car.transmission}`)}
          </span>
          <span className="flex items-center gap-1.5 hover:text-white transition-colors">
            <BoltIcon className="h-4 w-4 text-gray-500" />
            {t(`car.fuel_${car.fuel}`)}
          </span>
          <span className="text-gray-500 font-bold ml-auto">
            {car.year}
          </span>
        </div>

        {/* Price - Le clou du spectacle */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium lowercase italic">{t('car.per_day')}</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-display font-black text-white tracking-tight">
                {new Intl.NumberFormat().format(car.price_per_day)}
              </span>
              <span className="text-sm font-bold text-gnYellow">GNF</span>
            </div>
          </div>
          
          <div className="bg-gnYellow text-black font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-tighter group-hover:bg-white transition-colors">
            {t('common.details') || 'Voir'}
          </div>
        </div>
      </div>
    </Link>
  );
}