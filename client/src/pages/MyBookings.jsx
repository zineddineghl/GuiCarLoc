import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../App';
import { CalendarIcon, MapPinIcon, CheckIcon, XMarkIcon, StarIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import ReviewModal from '../components/ReviewModal';

const today = new Date();
today.setHours(0, 0, 0, 0);

function isBookingPast(booking) {
  if (booking.status === 'pending') return false;
  if (booking.status === 'confirmed') return new Date(booking.end_date) < today;
  return true; // rejected, cancelled
}

const STATUS_BADGE = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  rejected: 'badge-rejected',
  cancelled: 'badge-cancelled'
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
}

function BookingCard({ booking, onStatusChange, isOwnerView, onReviewSuccess }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const otherUserId = isOwnerView ? booking.renter_id : booking.owner_id;
  const [showReview, setShowReview] = useState(false);
  const [hasReview, setHasReview] = useState(Boolean(booking.has_review));
  const [confirmCancel, setConfirmCancel] = useState(false);

  const canReview = !isOwnerView
    && booking.status === 'confirmed'
    && new Date(booking.end_date) < new Date()
    && !hasReview;

  const canCancel = !isBookingPast(booking) && (
    (!isOwnerView && (booking.status === 'pending' || booking.status === 'confirmed')) ||
    (isOwnerView && booking.status === 'confirmed')
  );

  const handleStatus = async (status) => {
    setLoading(true);
    try {
      await onStatusChange(booking.id, status);
    } finally {
      setLoading(false);
    }
  };

  const firstImage = booking.images && booking.images.length > 0 ? booking.images[0] : null;

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Car Image */}
        <Link to={`/cars/${booking.car_id}`} className="flex-shrink-0">
          <div className="w-full sm:w-28 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            {firstImage ? (
              <img
                src={`/uploads/${firstImage}`}
                alt={booking.car_title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={e => { 
                  e.target.onerror = null; // Évite une boucle infinie
                  e.target.src = "data:image/svg+xml,..."; // Ou simplement cacher et montrer l'emoji
                }}
              />
            ) : (
              <span className="text-3xl opacity-40">🚗</span>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <Link to={`/cars/${booking.car_id}`} className="font-bold text-gray-900 hover:text-primary-700 transition-colors">
              {booking.car_title || `${booking.brand} ${booking.model}`}
            </Link>
            <span className={STATUS_BADGE[booking.status] || 'badge-pending'}>
              {t(`booking.status_${booking.status}`)}
            </span>
          </div>

          <p className="text-sm text-gray-500 flex items-center gap-1 mb-1">
            <MapPinIcon className="h-3.5 w-3.5" />
            {booking.city}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <CalendarIcon className="h-3.5 w-3.5 text-gray-400" />
              {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
            </span>
            <span className="font-semibold text-primary-700">
              {t('booking.total')}: {booking.total_price} GNF
            </span>
          </div>

          {isOwnerView ? (
            <p className="text-xs text-gray-400 mt-1">
              {t('booking.renter')}: <span className="text-gray-600 font-medium">{booking.renter_name}</span>
              {booking.renter_phone && ` · ${booking.renter_phone}`}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">
              {t('car.owner')}: <span className="text-gray-600 font-medium">{booking.owner_name}</span>
              {booking.owner_phone && ` · ${booking.owner_phone}`}
            </p>
          )}

          {booking.message && (
            <p className="text-xs text-gray-500 mt-1 italic">"{booking.message}"</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col gap-2 sm:items-end justify-end">
          {canCancel && !confirmCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
              {i18n.language.startsWith('fr') ? 'Annuler la réservation' : 'Cancel booking'}
            </button>
          )}
          {confirmCancel && (
            <div className="flex flex-col gap-1.5 items-end bg-red-50 border border-red-200 rounded-lg p-2">
              <p className="text-xs text-red-700 font-medium text-right">
                {i18n.language.startsWith('fr') ? 'Confirmer l\'annulation ?' : 'Confirm cancellation?'}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {i18n.language.startsWith('fr') ? 'Non' : 'No'}
                </button>
                <button
                  onClick={() => { setConfirmCancel(false); handleStatus('cancelled'); }}
                  disabled={loading}
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading
                    ? '...'
                    : (i18n.language.startsWith('fr') ? 'Oui, annuler' : 'Yes, cancel')}
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate(`/messages/${otherUserId}`)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 border border-primary-200 text-primary-700 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-colors"
          >
            <ChatBubbleLeftIcon className="h-3.5 w-3.5" />
            {t('booking.send_message') || 'Message'}
          </button>
          {canReview && (
            <button
              onClick={() => setShowReview(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-yellow-50 border border-yellow-300 text-yellow-700 rounded-lg text-xs font-semibold hover:bg-yellow-100 transition-colors"
            >
              <StarIcon className="h-3.5 w-3.5" />
              {t('review.leave_review')}
            </button>
          )}
          {showReview && (
            <ReviewModal
              booking={booking}
              onClose={() => setShowReview(false)}
              onSuccess={() => {
                setShowReview(false);
                setHasReview(true);
                onReviewSuccess?.();
              }}
            />
          )}
          {isOwnerView && booking.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatus('confirmed')}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                {t('booking.confirm')}
              </button>
              <button
                onClick={() => handleStatus('rejected')}
                disabled={loading}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
                {t('booking.reject')}
              </button>
            </>
          )}
          <p className="text-xs text-gray-400 whitespace-nowrap">
            {formatDate(booking.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MyBookings() {
  const { t } = useTranslation();
  const { user, setNotifCount } = useAuth();
  const [myBookings, setMyBookings] = useState([]);
  const [receivedBookings, setReceivedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('my');

  const isOwner = user && (user.role === 'owner' || user.role === 'both');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [myRes, receivedRes] = await Promise.all([
          axios.get('/api/bookings/my'),
          isOwner ? axios.get('/api/bookings/received') : Promise.resolve({ data: { bookings: [] } })
        ]);
        setMyBookings(myRes.data.bookings);
        setReceivedBookings(receivedRes.data.bookings);
        // Mark renter responses as seen and refresh notif count
        axios.put('/api/bookings/seen').then(() => {
          axios.get('/api/bookings/notifications')
            .then(res => setNotifCount(res.data.total || 0))
            .catch(() => {});
        }).catch(() => {});
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isOwner, t]);

  const handleStatusChange = async (bookingId, status) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status });
      const update = (list) =>
        list.map(b => b.id === bookingId ? { ...b, status } : b);
      setMyBookings(prev => update(prev));
      setReceivedBookings(prev => update(prev));
      // Refresh notification count immediately
      axios.get('/api/bookings/notifications')
        .then(res => setNotifCount(res.data.total || 0))
        .catch(() => {});
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card h-28 bg-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('booking.my_bookings_title')}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      {isOwner && (
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === 'my'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('booking.my_bookings_title')}
            {myBookings.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-primary-100 text-primary-700 rounded-full text-xs">
                {myBookings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === 'received'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('booking.received_bookings_title')}
            {receivedBookings.filter(b => b.status === 'pending').length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                {receivedBookings.filter(b => b.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* My Bookings */}
      {(!isOwner || activeTab === 'my') && (() => {
        const active = myBookings.filter(b => !isBookingPast(b));
        const past = myBookings.filter(b => isBookingPast(b));
        return (
          <div className="space-y-4">
            {active.length === 0 && past.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-gray-500">{t('booking.no_bookings')}</p>
                <Link to="/listings" className="btn-primary mt-4 inline-block">
                  {t('nav.listings')}
                </Link>
              </div>
            ) : (
              <>
                {active.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onStatusChange={handleStatusChange}
                    isOwnerView={false}
                    onReviewSuccess={() => {}}
                  />
                ))}
                {past.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex-1 border-t border-gray-200" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {t('booking.history')}
                      </span>
                      <span className="flex-1 border-t border-gray-200" />
                    </div>
                    <div className="space-y-4 opacity-80">
                      {past.map(booking => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          onStatusChange={handleStatusChange}
                          isOwnerView={false}
                          onReviewSuccess={() => {}}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}

      {/* Received Bookings */}
      {isOwner && activeTab === 'received' && (() => {
        const active = receivedBookings.filter(b => !isBookingPast(b));
        const past = receivedBookings.filter(b => isBookingPast(b));
        return (
          <div className="space-y-4">
            {active.length === 0 && past.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📬</div>
                <p className="text-gray-500">{t('booking.no_received')}</p>
              </div>
            ) : (
              <>
                {active.map(booking => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onStatusChange={handleStatusChange}
                    isOwnerView={true}
                  />
                ))}
                {past.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex-1 border-t border-gray-200" />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {t('booking.history')}
                      </span>
                      <span className="flex-1 border-t border-gray-200" />
                    </div>
                    <div className="space-y-4 opacity-80">
                      {past.map(booking => (
                        <BookingCard
                          key={booking.id}
                          booking={booking}
                          onStatusChange={handleStatusChange}
                          isOwnerView={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}
