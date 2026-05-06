import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { imgUrl } from '../utils/imageUrl';
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const CAR_TYPE_ICONS = {
  sedan: '🚗', suv: '🚙', van: '🚐', sports: '🏎️', luxury: '🚘', compact: '🚕', scooter: '🛵', moto: '🏍️'
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
    const msg = i18n.language.startsWith('fr')
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
      <div className="bg-luxuryBlack min-h-screen pt-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="animate-pulse space-y-4">
             {[1, 2, 3].map(i => (
               <div key={i} className="card h-32 bg-white/5 border border-white/5 rounded-3xl" />
             ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-luxuryBlack min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter">
              {t('listing.my_listings_title') || 'Mes Annonces'}
            </h1>
            <p className="text-gnYellow font-bold text-xs uppercase tracking-widest mt-2">
              {cars.length} {t('listing.listings_count') || 'véhicule(s)'}
            </p>
          </div>
          <Link to="/post-listing" className="btn-primary flex items-center gap-2 px-6 py-3 shrink-0">
            <PlusCircleIcon className="h-5 w-5" />
            {t('listing.add_listing') || 'Ajouter un véhicule'}
          </Link>
        </div>

        {error && (
          <div className="bg-gnRed/10 border border-gnRed/20 text-gnRed rounded-xl p-4 mb-8 text-sm font-bold">
            {error}
          </div>
        )}

        {cars.length === 0 ? (
          <div className="text-center py-24 bg-luxuryDark rounded-[40px] border border-white/5 border-dashed">
            <div className="text-6xl mb-6 opacity-40">🚗</div>
            <h3 className="text-2xl font-display font-bold text-white mb-3">
              {t('listing.no_listings') || 'Aucune annonce'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">
              {t('listing.post_first') || 'Vous n\'avez pas encore publié de voiture. Commencez à générer des revenus dès maintenant.'}
            </p>
            <Link to="/post-listing" className="btn-primary px-8">
              {t('listing.add_listing') || 'Publier ma première annonce'}
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {cars.map(car => {
              const typeIcon = CAR_TYPE_ICONS[car.type] || '🚗';
              const firstImage = car.images && car.images.length > 0 ? car.images[0] : null;

              return (
                <div key={car.id} className="card p-5 border border-white/5 bg-luxuryDark rounded-3xl flex flex-col sm:flex-row gap-6 hover:bg-white/5 transition-colors group">
                  
                  {/* Image */}
                  <Link to={`/cars/${car.id}`} className="flex-shrink-0">
                    <div className="w-full sm:w-40 h-32 rounded-2xl overflow-hidden bg-black/50 flex items-center justify-center relative border border-white/5">
                      {firstImage ? (
                        <img
                          src={imgUrl(firstImage)}
                          alt={car.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="text-5xl opacity-20">{typeIcon}</span>
                      )}
                      
                      {/* Badge Statut sur l'image */}
                      <div className="absolute top-2 left-2">
                         {car.available ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-gnGreen/90 backdrop-blur-md text-white rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg">
                            <CheckCircleIcon className="h-3 w-3" />
                            {t('car.available') || 'Actif'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-gnRed/90 backdrop-blur-md text-white rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg">
                            <XCircleIcon className="h-3 w-3" />
                            {t('car.unavailable') || 'Inactif'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link to={`/cars/${car.id}`} className="font-display font-black text-xl text-white hover:text-gnYellow transition-colors line-clamp-1 mb-1">
                        {car.title}
                      </Link>
                      
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                        <MapPinIcon className="h-4 w-4 text-gnYellow/50" />
                        {car.city} <span className="opacity-50">|</span> {car.brand} {car.model} ({car.year})
                      </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-6 text-sm bg-black/20 p-3 rounded-xl border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Tarif</span>
                        <span className="font-black text-white">{new Intl.NumberFormat().format(car.price_per_day)} <span className="text-gnYellow text-xs">GNF/j</span></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Réservations</span>
                        <span className="font-bold text-gray-300">
                          {car.total_bookings || 0}
                          {car.pending_bookings > 0 && (
                            <span className="ml-2 text-gnYellow animate-pulse">
                              ({car.pending_bookings} {t('listing.pending_count') || 'en attente'})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 justify-end sm:justify-start border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-6 shrink-0">
                    <button
                      onClick={() => handleToggleAvailability(car)}
                      className={`flex items-center justify-center w-full px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        car.available
                          ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20'
                          : 'bg-gnGreen/10 text-gnGreen border-gnGreen/20 hover:bg-gnGreen/20'
                      }`}
                    >
                      {car.available ? t('listing.deactivate') || 'Désactiver' : t('listing.activate') || 'Activer'}
                    </button>

                    <Link
                      to={`/edit-listing/${car.id}`}
                      className="flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      {t('common.edit') || 'Modifier'}
                    </Link>

                    <button
                      onClick={() => handleDelete(car.id, car.title)}
                      disabled={deletingId === car.id}
                      className="flex items-center justify-center gap-1.5 w-full px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gnRed/20 text-gnRed bg-gnRed/5 hover:bg-gnRed/10 transition-all disabled:opacity-50 mt-auto"
                    >
                      <TrashIcon className="h-4 w-4" />
                      {deletingId === car.id ? '...' : t('common.delete') || 'Supprimer'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}