import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { imgUrl } from '../utils/imageUrl';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  CogIcon, 
  BeakerIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function CarDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États pour la réservation
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    axios.get(`/api/cars/${id}`)
      .then(res => setCar(res.data.car))
      .catch(err => setError(err.response?.data?.error || 'Voiture introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  // Algorithme de calcul du prix
  const pricing = useMemo(() => {
    if (!car || !startDate || !endDate) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // On met à minuit pour éviter les bugs de fuseau horaire
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end - start;
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Différence en jours

    if (totalDays <= 0) return { error: 'Les dates sont invalides.' };
    
    // Vérification des limites de durée
    if (car.min_rental_days && totalDays < car.min_rental_days) {
      return { error: `Cette voiture nécessite une location de ${car.min_rental_days} jours minimum.` };
    }
    if (car.max_rental_days && totalDays > car.max_rental_days) {
      return { error: `Cette voiture ne peut pas être louée plus de ${car.max_rental_days} jours.` };
    }

    // Calcul des jours (Semaine vs Week-end)
    let weekDays = 0;
    let weekendDays = 0;
    let currentDate = new Date(start);

    for (let i = 0; i < totalDays; i++) {
      const dayOfWeek = currentDate.getDay(); // 0 = Dimanche, 6 = Samedi
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendDays++;
      } else {
        weekDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const standardPrice = Number(car.price_per_day);
    const wEPrice = car.weekend_price ? Number(car.weekend_price) : standardPrice;

    const totalWeek = weekDays * standardPrice;
    const totalWeekend = weekendDays * wEPrice;
    let subTotal = totalWeek + totalWeekend;
    let discountPercent = 0;

    // Application des réductions
    if (totalDays >= 7 && car.discount_7_days) {
      discountPercent = car.discount_7_days;
    } else if (totalDays >= 3 && car.discount_3_days) {
      discountPercent = car.discount_3_days;
    }

    const discountAmount = subTotal * (discountPercent / 100);
    const finalTotal = subTotal - discountAmount;

    return {
      totalDays,
      weekDays,
      weekendDays,
      standardPrice,
      wEPrice,
      totalWeek,
      totalWeekend,
      subTotal,
      discountPercent,
      discountAmount,
      finalTotal,
      deposit: car.requires_deposit ? car.deposit_amount : 0
    };
  }, [car, startDate, endDate]);

  const handleBooking = async () => {
    if (!pricing || pricing.error) return;
    setBookingLoading(true);
    try {
      // Ajuste cette route selon ton backend de réservation
      await axios.post('/api/bookings', {
        carId: car.id,
        startDate,
        endDate,
        totalPrice: pricing.finalTotal
      });
      navigate('/my-bookings');
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-luxuryBlack flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gnYellow"></div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen bg-luxuryBlack flex items-center justify-center text-gnRed font-bold">
        {error || 'Voiture introuvable.'}
      </div>
    );
  }

  // Format monétaire
  const formatGNF = (amount) => new Intl.NumberFormat('fr-FR').format(amount) + ' GNF';

  return (
    <div className="bg-luxuryBlack min-h-screen pb-20">
      {/* Galerie d'images (Hero) */}
      <div className="w-full h-[40vh] md:h-[60vh] bg-black relative">
        <img 
          src={car.images?.length > 0 ? imgUrl(car.images[0]) : '/placeholder.jpg'} 
          alt={car.title} 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-luxuryBlack to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* COLONNE GAUCHE : Détails */}
          <div className="lg:w-2/3 space-y-8">
            <div className="bg-luxuryDark border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
                    {car.brand} {car.model}
                  </h1>
                  <p className="text-gnYellow font-bold tracking-widest uppercase text-sm mt-2">
                    {car.year} • {car.city}
                  </p>
                </div>
              </div>

              {/* Badges Spécifications */}
              <div className="flex flex-wrap gap-4 mt-8 py-6 border-y border-white/5">
                <div className="flex items-center gap-2 text-gray-300">
                  <UserGroupIcon className="w-5 h-5 text-gnYellow" />
                  <span className="text-sm font-bold">{car.seats} Places</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <CogIcon className="w-5 h-5 text-gnYellow" />
                  <span className="text-sm font-bold uppercase">{car.transmission}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <BeakerIcon className="w-5 h-5 text-gnYellow" />
                  <span className="text-sm font-bold uppercase">{car.fuel}</span>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-white font-bold text-lg mb-4 uppercase tracking-widest">Description</h2>
                <p className="text-gray-400 leading-relaxed text-sm">
                  {car.description || "Aucune description fournie pour ce véhicule."}
                </p>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : Réservation & Prix */}
          <div className="lg:w-1/3">
            <div className="bg-luxuryDark border border-gnYellow/20 rounded-3xl p-6 sticky top-24 shadow-[0_0_40px_rgba(252,209,22,0.05)]">
              <h2 className="text-2xl font-black text-white mb-1">
                {formatGNF(car.price_per_day)} <span className="text-sm text-gray-500 font-normal">/ jour</span>
              </h2>
              
              {/* Infos Tarifaires Rapides */}
              <div className="flex flex-col gap-2 mt-4 mb-6 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-white/5 pb-6">
                {car.weekend_price && (
                  <div className="flex justify-between">
                    <span>Prix Week-end :</span>
                    <span className="text-white">{formatGNF(car.weekend_price)} /j</span>
                  </div>
                )}
                {car.discount_3_days > 0 && (
                  <div className="flex justify-between text-gnGreen">
                    <span>Réduction 3+ jours :</span>
                    <span>-{car.discount_3_days}%</span>
                  </div>
                )}
                {car.discount_7_days > 0 && (
                  <div className="flex justify-between text-gnGreen">
                    <span>Réduction 7+ jours :</span>
                    <span>-{car.discount_7_days}%</span>
                  </div>
                )}
              </div>

              {/* Sélection des dates */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Début</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gnYellow/50 outline-none color-scheme-dark"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Fin</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gnYellow/50 outline-none color-scheme-dark"
                  />
                </div>
              </div>

              {/* Reçu détaillé (affiché uniquement si les dates sont valides) */}
              {pricing && !pricing.error && (
                <div className="bg-black/50 rounded-2xl p-4 mb-6 border border-white/5 text-sm">
                  <div className="space-y-3 mb-4 border-b border-white/5 pb-4">
                    {pricing.weekDays > 0 && (
                      <div className="flex justify-between text-gray-300">
                        <span>{formatGNF(pricing.standardPrice)} x {pricing.weekDays} j (Semaine)</span>
                        <span>{formatGNF(pricing.totalWeek)}</span>
                      </div>
                    )}
                    {pricing.weekendDays > 0 && (
                      <div className="flex justify-between text-gray-300">
                        <span>{formatGNF(pricing.wEPrice)} x {pricing.weekendDays} j (Week-end)</span>
                        <span>{formatGNF(pricing.totalWeekend)}</span>
                      </div>
                    )}
                    {pricing.discountPercent > 0 && (
                      <div className="flex justify-between text-gnGreen font-bold">
                        <span>Réduction ({pricing.discountPercent}%)</span>
                        <span>-{formatGNF(pricing.discountAmount)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between text-white font-black text-lg">
                    <span>Total</span>
                    <span className="text-gnYellow">{formatGNF(pricing.finalTotal)}</span>
                  </div>

                  {pricing.deposit > 0 && (
                    <div className="mt-4 flex gap-2 text-xs text-gray-400 bg-white/5 p-3 rounded-lg border border-white/5">
                      <ExclamationTriangleIcon className="w-5 h-5 text-gnYellow shrink-0" />
                      <p>
                        Une caution de <strong className="text-white">{formatGNF(pricing.deposit)}</strong> sera exigée par le propriétaire avant la remise des clés.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Affichage d'erreur de date (ex: durée min/max) */}
              {pricing?.error && (
                <div className="bg-gnRed/10 border border-gnRed/20 text-gnRed text-xs font-bold p-4 rounded-xl mb-6">
                  {pricing.error}
                </div>
              )}

              <button 
                onClick={handleBooking}
                disabled={!pricing || !!pricing.error || bookingLoading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-gnYellow to-[#D4AF37] text-black font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-[0_10px_20px_rgba(252,209,22,0.2)]"
              >
                {bookingLoading ? 'Traitement...' : 'Réserver ce véhicule'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}