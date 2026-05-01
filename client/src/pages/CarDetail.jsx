import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../App';
import { imgUrl } from '../utils/imageUrl';
import DateRangePicker from '../components/DateRangePicker';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import {
  MapPinIcon,
  UserGroupIcon,
  CogIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  HeartIcon,
  NoSymbolIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const CAR_TYPE_ICONS = {
  sedan: '🚗', suv: '🚙', van: '🚐', sports: '🏎️', luxury: '🚘', economy: '🚕'
};
const FUEL_ICONS = { petrol: '⛽', diesel: '🛢️', electric: '⚡', hybrid: '🔋' };

function StatusBadge({ available }) {
  const { t } = useTranslation();
  if (available) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gnGreen/20 text-gnGreen rounded-full text-xs font-bold uppercase tracking-wider border border-gnGreen/30">
        <CheckCircleIcon className="h-3.5 w-3.5" />
        {t('car.available')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gnRed/20 text-gnRed rounded-full text-xs font-bold uppercase tracking-wider border border-gnRed/30">
      <XCircleIcon className="h-3.5 w-3.5" />
      {t('car.unavailable')}
    </span>
  );
}

export default function CarDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { user, favIds, toggleFavorite } = useAuth();
  const navigate = useNavigate();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [bookedRanges, setBookedRanges] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [booking, setBooking] = useState({
    start_date: today,
    end_date: tomorrow,
    message: ''
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  const [showBlocker, setShowBlocker] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [blockForm, setBlockForm] = useState({ start_date: today, end_date: tomorrow });
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockError, setBlockError] = useState('');

  useEffect(() => {
    axios.get(`/api/cars/${id}`)
      .then(res => setCar(res.data.car))
      .catch(err => {
        if (err.response?.status === 404) setError('Car not found');
        else setError(t('common.error'));
      })
      .finally(() => setLoading(false));

    axios.get(`/api/reviews/car/${id}`)
      .then(res => setReviews(res.data.reviews || []))
      .catch(() => {});

    axios.get(`/api/bookings/car/${id}/booked-dates`)
      .then(res => setBookedRanges(res.data.ranges || []))
      .catch(() => {});
  }, [id, t]);

  const isOwner = user && car && user.id === car.owner_id;

  useEffect(() => {
    if (!isOwner) return;
    axios.get(`/api/cars/${id}/blocked-dates`)
      .then(res => setBlockedDates(res.data.blocked || []))
      .catch(() => {});
  }, [isOwner, id]);

  const handleDateChange = ({ start_date, end_date }) => {
    setBooking(prev => ({ ...prev, start_date, end_date }));
    setBookingError('');
    setBookingSuccess('');
  };

  const calculateDays = () => {
    if (!booking.start_date || !booking.end_date) return 0;
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!car) return 0;
    return (calculateDays() * car.price_per_day).toFixed(2);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (calculateDays() < 1) { setBookingError('Please select valid dates'); return; }

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      await axios.post('/api/bookings', {
        car_id: car.id,
        start_date: booking.start_date,
        end_date: booking.end_date,
        message: booking.message
      });
      setBookingSuccess(i18n.language === 'fr'
          ? 'Demande de réservation envoyée avec succès !'
          : 'Booking request sent successfully!');
      setBooking({ start_date: today, end_date: tomorrow, message: '' });
    } catch (err) {
      setBookingError(err.response?.data?.error || t('common.error'));
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    setBlockLoading(true);
    setBlockError('');
    try {
      const res = await axios.post(`/api/cars/${id}/blocked-dates`, blockForm);
      setBlockedDates(prev => [...prev, res.data.block]);
      setBookedRanges(prev => [...prev, { ...res.data.block, type: 'blocked' }]);
    } catch (err) {
      setBlockError(err.response?.data?.error || 'Erreur');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleRemoveBlock = async (blockId) => {
    try {
      await axios.delete(`/api/cars/${id}/blocked-dates/${blockId}`);
      setBlockedDates(prev => prev.filter(b => b.id !== blockId));
      setBookedRanges(prev => prev.filter(r => !(r.type === 'blocked' && r.id === blockId)));
    } catch { }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse bg-luxuryBlack"></div>;
  if (error || !car) return <div className="text-center py-20 text-white"><h2 className="text-2xl font-bold">{error || 'Car not found'}</h2></div>;

  const days = calculateDays();
  const total = calculateTotal();
  const typeIcon = CAR_TYPE_ICONS[car.type] || '🚗';
  const fuelIcon = FUEL_ICONS[car.fuel] || '⛽';
  const isFav = favIds.has(car.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white font-medium mb-6 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t('common.back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Car Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Image Gallery */}
          <div className="card overflow-hidden border border-white/5">
            {car.images && car.images.length > 0 ? (
              <div>
                <div className="relative h-72 sm:h-[450px] bg-luxuryDark overflow-hidden">
                  <img
                    src={imgUrl(car.images[activeImage])}
                    alt={car.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
                {car.images.length > 1 && (
                  <div className="p-4 flex gap-3 overflow-x-auto bg-black/20">
                    {car.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          activeImage === idx ? 'border-gnYellow scale-105' : 'border-transparent opacity-40 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl(img)} alt="thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-72 sm:h-96 bg-luxuryDark flex items-center justify-center">
                <span className="text-9xl opacity-10">{typeIcon}</span>
              </div>
            )}
          </div>

          {/* Car Info */}
          <div className="card p-8 border border-white/5">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gnYellow font-bold text-xs uppercase tracking-widest">{t(`car.type_${car.type}`)}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-black text-white mb-2 uppercase tracking-tight">{car.title}</h1>
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPinIcon className="h-4 w-4 text-gnYellow" />
                  <span className="text-sm font-medium">{car.city}{car.address ? `, ${car.address}` : ''}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <StatusBadge available={car.available} />
                {user && (
                  <button onClick={() => toggleFavorite(car.id)} className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                    {isFav ? <HeartSolidIcon className="h-6 w-6 text-gnRed" /> : <HeartIcon className="h-6 w-6 text-white" />}
                  </button>
                )}
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: t('car.year'), val: car.year, icon: '📅' },
                { label: t('car.seats'), val: car.seats, icon: '👥' },
                { label: t('car.transmission'), val: t(`car.transmission_${car.transmission}`), icon: '⚙️' },
                { label: t('car.fuel'), val: t(`car.fuel_${car.fuel}`), icon: fuelIcon }
              ].map((spec, i) => (
                <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center hover:bg-white/10 transition-colors">
                  <div className="text-2xl mb-1">{spec.icon}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{spec.label}</div>
                  <div className="font-bold text-white text-sm mt-0.5">{spec.val}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="pt-6 border-t border-white/5">
              <h3 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-3">{t('car.description')}</h3>
              <p className="text-gray-300 leading-relaxed text-base italic font-light">
                {car.description || t('car.no_description')}
              </p>
            </div>
          </div>

          {/* Availability Calendar */}
          <div className="card p-2 border border-white/5 overflow-hidden">
            <AvailabilityCalendar bookedRanges={bookedRanges} lang={i18n.language.startsWith('fr') ? 'fr' : 'en'} />
          </div>

          {/* Owner Info */}
          <div className="card p-8 border border-white/5">
            <h3 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6">{t('car.owner')}</h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                {car.owner_avatar ? (
                  <img src={imgUrl(car.owner_avatar)} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/10" alt="avatar" />
                ) : (
                  <div className="w-20 h-20 bg-gnYellow/10 rounded-2xl flex items-center justify-center text-gnYellow font-black text-3xl border border-gnYellow/20">
                    {car.owner_name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-gnGreen w-6 h-6 rounded-full border-4 border-luxuryBlack"></div>
              </div>
              <div className="flex-1">
                <Link to={`/profile/${car.owner_id}`} className="text-2xl font-bold text-white hover:text-gnYellow transition-colors">{car.owner_name}</Link>
                <div className="flex flex-col gap-2 mt-3">
                  <a href={`mailto:${car.owner_email}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <EnvelopeIcon className="h-4 w-4 text-gnYellow/50" /> {car.owner_email}
                  </a>
                  {car.owner_phone && (
                    <a href={`tel:${car.owner_phone}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                      <PhoneIcon className="h-4 w-4 text-gnYellow/50" /> {car.owner_phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Booking Widget */}
        <div className="lg:col-span-1">
          <div className="card p-8 sticky top-24 border border-white/5 bg-luxuryDark/50 backdrop-blur-xl">
            <div className="flex items-baseline gap-2 mb-8 border-b border-white/5 pb-6">
              <span className="text-4xl font-display font-black text-white">{new Intl.NumberFormat().format(car.price_per_day)}</span>
              <span className="text-gnYellow font-bold text-sm">GNF / {t('car.per_day')}</span>
            </div>

            {isOwner ? (
              <div className="space-y-4">
                <div className="bg-gnYellow/5 border border-gnYellow/20 rounded-2xl p-5 text-center">
                  <p className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-4">Votre Annonce</p>
                  <Link to={`/edit-listing/${car.id}`} className="btn-primary w-full block mb-3">{t('common.edit')}</Link>
                  <button onClick={() => setShowBlocker(v => !v)} className="w-full text-xs font-bold text-gray-400 hover:text-white transition-colors">
                    {showBlocker ? 'Fermer le gestionnaire' : 'Gérer les disponibilités'}
                  </button>
                </div>
                {showBlocker && (
                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10 animate-fadeIn">
                      <form onSubmit={handleAddBlock} className="space-y-3">
                        <input type="date" value={blockForm.start_date} min={today} onChange={e => setBlockForm(p => ({ ...p, start_date: e.target.value }))} className="input-field text-sm" required />
                        <input type="date" value={blockForm.end_date} min={blockForm.start_date} onChange={e => setBlockForm(p => ({ ...p, end_date: e.target.value }))} className="input-field text-sm" required />
                        <button type="submit" disabled={blockLoading} className="btn-primary w-full py-2 text-xs">Bloquer ces dates</button>
                      </form>
                      <div className="mt-4 space-y-2">
                        {blockedDates.map(b => (
                          <div key={b.id} className="flex items-center justify-between bg-black/40 p-2 rounded-lg text-[10px] text-gray-300">
                            <span>{b.start_date} → {b.end_date}</span>
                            <button onClick={() => handleRemoveBlock(b.id)}><TrashIcon className="h-3 w-3 text-gnRed" /></button>
                          </div>
                        ))}
                      </div>
                   </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <DateRangePicker startDate={booking.start_date} endDate={booking.end_date} onChange={handleDateChange} bookedRanges={bookedRanges} lang={i18n.language.startsWith('fr') ? 'fr' : 'en'} />
                
                {days > 0 && (
                  <div className="bg-white/5 rounded-2xl p-5 space-y-3 border border-white/5">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{new Intl.NumberFormat().format(car.price_per_day)} GNF × {days} j</span>
                      <span className="text-white font-bold">{new Intl.NumberFormat().format(total)} GNF</span>
                    </div>
                    <div className="border-t border-white/5 pt-3 flex justify-between">
                      <span className="text-sm font-bold text-white">Total</span>
                      <span className="text-xl font-display font-black text-gnYellow">{new Intl.NumberFormat().format(total)} GNF</span>
                    </div>
                  </div>
                )}

                <textarea value={booking.message} onChange={e => setBooking(prev => ({ ...prev, message: e.target.value }))} placeholder={t('booking.message_placeholder')} rows={3} className="input-field text-sm bg-black/20" />

                {bookingError && <div className="p-3 bg-gnRed/10 border border-gnRed/20 text-gnRed text-xs rounded-xl text-center">{bookingError}</div>}
                {bookingSuccess && <div className="p-3 bg-gnGreen/10 border border-gnGreen/20 text-gnGreen text-xs rounded-xl text-center">{bookingSuccess}</div>}

                <button type="submit" disabled={bookingLoading || !car.available || days < 1} className="btn-primary w-full py-4 text-lg font-black uppercase tracking-tighter">
                  {bookingLoading ? t('common.loading') : t('booking.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}