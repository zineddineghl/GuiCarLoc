import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { imgUrl } from '../utils/imageUrl';
import { calculateRentalPrice } from '../utils/priceUtils';
import { 
  UserGroupIcon, 
  CogIcon, 
  BeakerIcon, 
  CalendarIcon,
  MapPinIcon,
  HeartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

export default function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // États de réservation
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    axios.get(`/api/cars/${id}`)
      .then(res => setCar(res.data.car))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const pricing = useMemo(() => {
    if (!car || !startDate || !endDate) return null;
    
    // Calcul hyper précis via l'utilitaire mis à jour
    const result = calculateRentalPrice(car, startDate, endDate);
    if (result.error) return result;

    // Vérification des limites de durée
    if (car.min_rental_days && result.totalDays < car.min_rental_days) {
      return { error: `Location de ${car.min_rental_days} jours minimum.` };
    }
    if (car.max_rental_days && result.totalDays > car.max_rental_days) {
      return { error: `Maximum ${car.max_rental_days} jours autorisés.` };
    }
    
    return result;
  }, [car, startDate, endDate]);

  if (loading || !car) return (
    <div className="h-screen bg-luxuryBlack flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gnYellow"></div>
    </div>
  );

  const formatGNF = (val) => new Intl.NumberFormat('fr-FR').format(val) + ' GNF';

  return (
    <div className="bg-luxuryBlack min-h-screen pb-20">
      
      {/* 1. GALERIE PHOTO */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="relative rounded-3xl overflow-hidden h-[500px] border border-white/5 shadow-2xl">
          <img src={car.images?.length > 0 ? imgUrl(car.images[activeImage]) : '/placeholder.jpg'} className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        
        {/* Thumbnails */}
        <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
          {car.images?.map((img, i) => (
            <button 
              key={i} 
              onClick={() => setActiveImage(i)} 
              className={`w-24 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? 'border-gnYellow scale-105' : 'border-white/10 opacity-50'}`}
            >
              <img src={imgUrl(img)} className="w-full h-full object-cover" alt="" />
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* COLONNE GAUCHE */}
          <div className="lg:w-2/3 space-y-8">
            <div className="bg-luxuryDark border border-white/5 rounded-[40px] p-10 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block px-4 py-1 bg-gnYellow/10 text-gnYellow text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4">
                    {car.type}
                  </span>
                  <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">
                    {car.brand} {car.model}
                  </h1>
                  <p className="flex items-center gap-2 text-gray-400 font-bold">
                    <MapPinIcon className="w-5 h-5 text-gnYellow" /> {car.city}
                  </p>
                </div>
                <button className="p-4 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all">
                  <HeartIcon className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* FICHES TECHNIQUES (SPEC CARDS) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                {[
                  { label: 'Année', value: car.year, icon: CalendarIcon },
                  { label: 'Places', value: car.seats, icon: UserGroupIcon },
                  { label: 'Transmission', value: car.transmission, icon: CogIcon },
                  { label: 'Carburant', value: car.fuel, icon: BeakerIcon }
                ].map((spec, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-[30px] flex flex-col items-center gap-3">
                    <spec.icon className="w-6 h-6 text-gnYellow" />
                    <div className="text-center">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{spec.label}</p>
                      <p className="text-white font-bold uppercase text-sm">{spec.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12">
                <h3 className="text-gnYellow text-xs font-black uppercase tracking-widest mb-4">Description</h3>
                <p className="text-gray-400 leading-relaxed italic">{car.description || "Pas de description."}</p>
              </div>
            </div>

            {/* SECTION DISPONIBILITÉS */}
            <div className="bg-luxuryDark border border-white/5 rounded-[40px] p-10">
              <h3 className="text-white font-black uppercase tracking-tight text-xl mb-8">Disponibilités</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/20 p-8 rounded-3xl">
                 <div className="text-center text-gray-500 italic">Calendrier Mai...</div>
                 <div className="text-center text-gray-500 italic">Calendrier Juin...</div>
              </div>
            </div>

            {/* PROPRIÉTAIRE */}
            <div className="bg-luxuryDark border border-white/5 rounded-[40px] p-8 flex items-center gap-6">
              <div className="w-16 h-16 bg-gnYellow rounded-2xl flex items-center justify-center text-black font-black text-2xl">
                {car.owner_name?.charAt(0)}
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-black">Propriétaire</p>
                <p className="text-white font-bold text-xl">{car.owner_name}</p>
              </div>
            </div>
          </div>

          {/* COLONNE DROITE (Widget Réservation) */}
          <div className="lg:w-1/3">
            <div className="bg-luxuryDark border border-gnYellow/20 rounded-[40px] p-8 sticky top-24 shadow-2xl">
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-4xl font-black text-white">{formatGNF(car.price_per_day)}</span>
                <span className="text-gnYellow text-sm font-bold uppercase">/ Jour</span>
              </div>

              <div className="space-y-6">
                
                {/* BLOC CAUTION (Toujours visible) */}
                {car.requires_deposit && (
                  <div className="p-4 bg-gnYellow/5 border border-gnYellow/20 rounded-2xl flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-gnYellow shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gnYellow font-black uppercase tracking-widest">Caution requise</p>
                      <p className="text-white font-bold text-sm">
                        {formatGNF(car.deposit_amount)}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1 leading-tight">
                        Le montant de la caution sera à régler directement auprès du propriétaire.
                      </p>
                    </div>
                  </div>
                )}

                {/* SÉLECTION DES DATES (Design Natif Dark) */}
                <div className="space-y-4 mb-6 mt-6">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Départ</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gnYellow/50 outline-none cursor-pointer transition-all hover:border-white/20"
                      style={{ colorScheme: 'dark' }} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Retour</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gnYellow/50 outline-none cursor-pointer transition-all hover:border-white/20"
                      style={{ colorScheme: 'dark' }} 
                    />
                  </div>
                </div>

                {/* ERREUR DE DATES */}
                {pricing?.error && (
                  <div className="p-4 bg-gnRed/10 border border-gnRed/20 rounded-2xl text-gnRed text-xs font-bold text-center">
                    {pricing.error}
                  </div>
                )}

                {/* FACTURE DÉTAILLÉE */}
                {pricing && !pricing.error && (
                  <div className="animate-fadeIn space-y-3 px-2">
                    
                    {/* Détail Semaine */}
                    {pricing.weekDays > 0 && (
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>{formatGNF(pricing.standardPrice)} x {pricing.weekDays} j (Semaine)</span>
                        <span className="text-white font-bold">{formatGNF(pricing.totalWeek)}</span>
                      </div>
                    )}
                    
                    {/* Détail Week-end */}
                    {pricing.weekendDays > 0 && (
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>{formatGNF(pricing.wEPrice)} x {pricing.weekendDays} j (Week-end)</span>
                        <span className="text-white font-bold">{formatGNF(pricing.totalWeekend)}</span>
                      </div>
                    )}
                    
                    {/* Réduction */}
                    {pricing.percentage > 0 && (
                      <div className="flex justify-between text-sm text-gnGreen font-bold mt-2">
                        <span>Réduction {pricing.percentage}%</span>
                        <span>-{formatGNF(pricing.discountAmount)}</span>
                      </div>
                    )}
                    
                    {/* Total Final */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-4">
                      <span className="text-xl font-black text-white uppercase">Total</span>
                      <span className="text-3xl font-black text-gnYellow">{formatGNF(pricing.total)}</span>
                    </div>
                  </div>
                )}

                <textarea placeholder="Parlez au propriétaire de votre voyage..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white h-32 resize-none focus:border-gnYellow outline-none transition-all" />

                <button disabled={!pricing || pricing.error} className="w-full py-6 rounded-2xl bg-gnYellow text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-30 shadow-lg shadow-gnYellow/20">
                  Envoyer la demande
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}