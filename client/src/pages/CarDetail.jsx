import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../App';
import DateRangePicker from '../components/DateRangePicker';
import {
  MapPinIcon,
  UserGroupIcon,
  CogIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const CAR_TYPE_ICONS = {
  sedan: '🚗', suv: '🚙', van: '🚐', sports: '🏎️', luxury: '🚘', economy: '🚕'
};
const FUEL_ICONS = { petrol: '⛽', diesel: '🛢️', electric: '⚡', hybrid: '🔋' };

function StatusBadge({ available }) {
  const { t } = useTranslation();
  if (available) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
        <CheckCircleIcon className="h-4 w-4" />
        {t('car.available')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
      <XCircleIcon className="h-4 w-4" />
      {t('car.unavailable')}
    </span>
  );
}

export default function CarDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
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
    if (!user) {
      navigate('/login');
      return;
    }
    if (calculateDays() < 1) {
      setBookingError('Please select valid dates');
      return;
    }

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-80 bg-gray-200 rounded-2xl"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-80 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-6xl mb-4">🚗</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Car not found'}</h2>
        <Link to="/listings" className="btn-primary mt-4 inline-block">
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const days = calculateDays();
  const total = calculateTotal();
  const typeIcon = CAR_TYPE_ICONS[car.type] || '🚗';
  const fuelIcon = FUEL_ICONS[car.fuel] || '⛽';
  const isOwner = user && user.id === car.owner_id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium mb-6 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        {t('common.back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Car Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="card overflow-hidden">
            {car.images && car.images.length > 0 ? (
              <div>
                <div className="relative h-72 sm:h-96 bg-gray-100 overflow-hidden">
                  <img
                    src={`/uploads/${car.images[activeImage]}`}
                    alt={car.title}
                    className="w-full h-full object-cover"
                    onError={e => {
                      e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-primary-50"><span class="text-8xl opacity-30">${typeIcon}</span></div>`;
                    }}
                  />
                </div>
                {car.images.length > 1 && (
                  <div className="p-3 flex gap-2 overflow-x-auto">
                    {car.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                          activeImage === idx ? 'border-primary-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={`/uploads/${img}`}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-72 sm:h-96 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <span className="text-9xl opacity-30">{typeIcon}</span>
              </div>
            )}
          </div>

          {/* Car Info */}
          <div className="card p-6">
            <div className="flex flex-wrap items-start gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{typeIcon}</span>
                  <span className="text-sm text-gray-500 font-medium">{t(`car.type_${car.type}`)}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{car.title}</h1>
                {car.avg_car_rating && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-yellow-400">★</span>
                    <span className="font-semibold text-gray-800">{car.avg_car_rating}</span>
                    <span className="text-sm text-gray-400">
                      ({car.review_count} {car.review_count === 1 ? t('review.review') : t('review.reviews')})
                    </span>
                  </div>
                )}
              </div>
              <StatusBadge available={car.available} />
            </div>

            <div className="flex items-center gap-2 text-gray-500 mb-6">
              <MapPinIcon className="h-4 w-4 flex-shrink-0" />
              <span>{car.city}{car.address ? `, ${car.address}` : ''}</span>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">📅</div>
                <div className="text-xs text-gray-500">{t('car.year')}</div>
                <div className="font-bold text-gray-900">{car.year}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">👥</div>
                <div className="text-xs text-gray-500">{t('car.seats')}</div>
                <div className="font-bold text-gray-900">{car.seats}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">⚙️</div>
                <div className="text-xs text-gray-500">{t('car.transmission')}</div>
                <div className="font-bold text-gray-900 text-sm">{t(`car.transmission_${car.transmission}`)}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{fuelIcon}</div>
                <div className="text-xs text-gray-500">{t('car.fuel')}</div>
                <div className="font-bold text-gray-900 text-sm">{t(`car.fuel_${car.fuel}`)}</div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-bold text-gray-900 mb-2">{t('car.description')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {car.description || t('car.no_description')}
              </p>
            </div>
          </div>

          {/* Owner Info */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t('car.owner')}</h3>
            <div className="flex items-start gap-4">
              {car.owner_avatar ? (
                <img
                  src={`/uploads/${car.owner_avatar}`}
                  alt={car.owner_name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl flex-shrink-0">
                  {car.owner_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/profile/${car.owner_id}`} className="font-semibold text-gray-900 hover:text-primary-700 transition-colors">
                    {car.owner_name}
                  </Link>
                  {car.avg_owner_rating && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <span className="text-yellow-400">★</span>
                      <span className="font-medium text-gray-700">{car.avg_owner_rating}</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 mt-2">
                  {car.owner_email && (
                    <a
                      href={`mailto:${car.owner_email}`}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-700 transition-colors"
                    >
                      <EnvelopeIcon className="h-4 w-4" />
                      {car.owner_email}
                    </a>
                  )}
                  {car.owner_phone && (
                    <a
                      href={`tel:${car.owner_phone}`}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-700 transition-colors"
                    >
                      <PhoneIcon className="h-4 w-4" />
                      {car.owner_phone}
                    </a>
                  )}
                </div>
                {user && !isOwner && (
                  <Link
                    to={`/messages/${car.owner_id}`}
                    className="mt-4 flex items-center justify-center gap-2 w-full btn-secondary text-sm"
                  >
                    <EnvelopeIcon className="h-4 w-4" />
                    {t('messages.contact_owner')}
                  </Link>
                )}
              </div>
            </div>
          </div>
          {/* Reviews */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4">
              {t('review.reviews')}
              {reviews.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">({reviews.length})</span>
              )}
            </h3>
            {reviews.length === 0 ? (
              <p className="text-gray-400 text-sm">{t('review.no_reviews')}</p>
            ) : (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 text-sm">{review.reviewer_name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {'★★★★★'.split('').map((s, i) => (
                        <span key={i} className={i < review.car_rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                      ))}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Booking Widget */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            {/* Price */}
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-3xl font-extrabold text-primary-700">{car.price_per_day}€</span>
              <span className="text-gray-500">{t('car.per_day')}</span>
            </div>

            {isOwner ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                <p className="text-blue-700 font-medium text-sm mb-3">This is your listing</p>
                <Link to={`/edit-listing/${car.id}`} className="btn-secondary btn-sm w-full">
                  {t('common.edit')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <h3 className="font-bold text-gray-900">{t('booking.title')}</h3>

                {/* Date Picker */}
                <DateRangePicker
                  startDate={booking.start_date}
                  endDate={booking.end_date}
                  onChange={handleDateChange}
                  bookedRanges={bookedRanges}
                  lang={i18n.language.startsWith('fr') ? 'fr' : 'en'}
                />
                {booking.start_date && !booking.end_date && (
                  <p className="text-xs text-primary-600 text-center -mt-1">
                    {i18n.language.startsWith('fr') ? 'Cliquez sur la date de fin' : 'Click the end date'}
                  </p>
                )}

                {/* Duration & Price */}
                {days > 0 && (
                  <div className="bg-primary-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {car.price_per_day}€ × {days} {days === 1 ? t('booking.day') : t('booking.days')}
                      </span>
                      <span className="font-semibold">{total}€</span>
                    </div>
                    <div className="border-t border-primary-200 pt-2 flex justify-between font-bold">
                      <span>{t('booking.total')}</span>
                      <span className="text-primary-700">{total}€</span>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="form-label text-xs">{t('booking.message')}</label>
                  <textarea
                    name="message"
                    value={booking.message}
                    onChange={e => { setBooking(prev => ({ ...prev, message: e.target.value })); }}
                    placeholder={t('booking.message_placeholder')}
                    rows={3}
                    className="input-field text-sm resize-none"
                  />
                </div>

                {/* Error / Success */}
                {bookingError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                    {bookingError}
                  </div>
                )}
                {bookingSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
                    {bookingSuccess}
                  </div>
                )}

                {user ? (
                  <button
                    type="submit"
                    disabled={bookingLoading || !car.available || days < 1}
                    className="btn-primary w-full"
                  >
                    {bookingLoading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                        {t('common.loading')}
                      </span>
                    ) : (
                      t('booking.submit')
                    )}
                  </button>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 text-center mb-3">
                      {t('booking.login_to_book')}
                    </p>
                    <Link to="/login" className="btn-primary w-full block text-center">
                      {t('auth.login')}
                    </Link>
                  </div>
                )}

                {!car.available && (
                  <p className="text-red-500 text-sm text-center">{t('car.unavailable')}</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
