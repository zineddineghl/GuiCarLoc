import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../App';
import { imgUrl } from '../utils/imageUrl';
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
  pending: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  confirmed: 'bg-gnGreen/10 text-gnGreen border-gnGreen/20',
  rejected: 'bg-gnRed/10 text-gnRed border-gnRed/20',
  cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
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
    <div className="card p-5 border border-white/5 bg-luxuryDark rounded-3xl flex flex-col sm:flex-row gap-6 hover:bg-white/5 transition-colors group">
      {/* Car Image */}
      <Link to={`/cars/${booking.car_id}`} className="flex-shrink-0">
        <div className="w-full sm:w-32 h-24 rounded-2xl overflow-hidden bg-black/50 flex items-center justify-center relative border border-white/5">
          {firstImage ? (
            <img
              src={imgUrl(firstImage)}
              alt={booking.car_title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={e => { 
                e.target.onerror = null;
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <span className="text-4xl opacity-20">🚗</span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-start gap-3 mb-2">
            <Link to={`/cars/${booking.car_id}`} className="font-display font-black text-lg text-white hover:text-gnYellow transition-colors line-clamp-1">
              {booking.car_title || `${booking.brand} ${booking.model}`}
            </Link>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${STATUS_BADGE[booking.status] || STATUS_BADGE.pending}`}>
              {t(`booking.status_${booking.status}`)}
            </span>
          </div>

          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
            <MapPinIcon className="h-4 w-4 text-gnYellow/50" />
            {booking.city}
          </p>

          <div className="flex flex-wrap gap-4 text-sm bg-black/20 p-3 rounded-xl border border-white/5 mb-3">
            <span className="flex items-center gap-1.5 text-gray-300 font-bold text-xs uppercase tracking-wider">
              <CalendarIcon className="h-4 w-4 text-gnYellow/70" />
              {formatDate(booking.start_date)} <span className="opacity-50">→</span> {formatDate(booking.end_date)}
            </span>
            <span className="font-black text-white ml-auto">
              {new Intl.NumberFormat().format(booking.total_price)} <span className="text-gnYellow text-xs">GNF</span>
            </span>
          </div>
        </div>

        {isOwnerView ? (
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {t('booking.renter')}: <span className="text-white">{booking.renter_name}</span>
            {booking.renter_phone && <span className="text-gnYellow/70 lowercase normal-case italic ml-1">({booking.renter_phone})</span>}
          </p>
        ) : (
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            {t('car.owner')}: <span className="text-white">{booking.owner_name}</span>
            {booking.owner_phone && <span className="text-gnYellow/70 lowercase normal-case italic ml-1">({booking.owner_phone})</span>}
          </p>
        )}

        {booking.message && (
          <p className="text-xs text-gray-400 mt-2 italic bg-white/5 p-2 rounded-lg border-l-2 border-gnYellow">"{booking.message}"</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex sm:flex-col gap-2 justify-end sm:justify-start border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-6 shrink-0 min-w-[140px]">
        {canCancel && !confirmCancel && (
          <button
            onClick={() => setConfirmCancel(true)}
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gnRed/20 text-gnRed bg-gnRed/5 hover:bg-gnRed/10 transition-all"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
            {i18n.language.startsWith('fr') ? 'Annuler' : 'Cancel'}
          </button>
        )}
        {confirmCancel && (
          <div className="flex flex-col gap-2 items-center bg-gnRed/10 border border-gnRed/20 rounded-xl p-3 w-full">
            <p className="text-[10px] text-gnRed font-bold uppercase tracking-widest text-center">
              {i18n.language.startsWith('fr') ? 'Confirmer ?' : 'Confirm?'}
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 py-1.5 text-[10px] font-bold border border-white/20 text-gray-400 rounded-lg hover:bg-white/10 transition-colors uppercase"
              >
                {i18n.language.startsWith('fr') ? 'Non' : 'No'}
              </button>
              <button
                onClick={() => { setConfirmCancel(false); handleStatus('cancelled'); }}
                disabled={loading}
                className="flex-1 py-1.5 text-[10px] font-bold bg-gnRed text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 uppercase"
              >
                {loading ? '...' : (i18n.language.startsWith('fr') ? 'Oui' : 'Yes')}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate(`/messages/${otherUserId}`)}
          className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
        >
          <ChatBubbleLeftIcon className="h-4 w-4 text-gnYellow" />
          Message
        </button>

        {canReview && (
          <button
            onClick={() => setShowReview(true)}
            className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gnYellow/50 text-gnYellow bg-gnYellow/10 hover:bg-gnYellow/20 transition-all mt-auto"
          >
            <StarIcon className="h-4 w-4" />
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
          <div className="flex flex-col gap-2 mt-auto w-full">
            <button
              onClick={() => handleStatus('confirmed')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gnGreen text-white hover:bg-green-600 transition-all disabled:opacity-50 shadow-lg"
            >
              <CheckIcon className="h-4 w-4" />
              {t('booking.confirm')}
            </button>
            <button
              onClick={() => handleStatus('rejected')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gnRed/20 text-gnRed bg-gnRed/5 hover:bg-gnRed/10 transition-all disabled:opacity-50"
            >
              <XMarkIcon className="h-4 w-4" />
              {t('booking.reject')}
            </button>
          </div>
        )}
        
        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center mt-auto pt-2">
          {formatDate(booking.created_at)}
        </p>
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
      <div className="bg-luxuryBlack min-h-screen pt-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="card h-32 bg-white/5 border border-white/5 rounded-3xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-luxuryBlack min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter mb-8">
          {t('booking.my_bookings_title') || 'Mes Réservations'}
        </h1>

        {error && (
          <div className="bg-gnRed/10 border border-gnRed/20 text-gnRed rounded-xl p-4 mb-8 text-sm font-bold">
            {error}
          </div>
        )}

        {/* Tabs */}
        {isOwner && (
          <div className="flex gap-4 mb-8 border-b border-white/10 pb-1">
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-colors relative ${
                activeTab === 'my'
                  ? 'text-gnYellow'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {t('booking.my_bookings_title') || 'Mes voyages'}
              {myBookings.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-white/10 text-white rounded-full text-[9px] border border-white/20">
                  {myBookings.length}
                </span>
              )}
              {activeTab === 'my' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gnYellow shadow-[0_0_10px_rgba(252,209,22,0.5)]" />}
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-colors relative ${
                activeTab === 'received'
                  ? 'text-gnYellow'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              {t('booking.received_bookings_title') || 'Demandes reçues'}
              {receivedBookings.filter(b => b.status === 'pending').length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-gnYellow text-black rounded-full text-[9px] border border-gnYellow/20 animate-pulse">
                  {receivedBookings.filter(b => b.status === 'pending').length}
                </span>
              )}
              {activeTab === 'received' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gnYellow shadow-[0_0_10px_rgba(252,209,22,0.5)]" />}
            </button>
          </div>
        )}

        {/* My Bookings */}
        {(!isOwner || activeTab === 'my') && (() => {
          const active = myBookings.filter(b => !isBookingPast(b));
          const past = myBookings.filter(b => isBookingPast(b));
          return (
            <div className="space-y-6">
              {active.length === 0 && past.length === 0 ? (
                <div className="text-center py-24 bg-luxuryDark rounded-[40px] border border-white/5 border-dashed">
                  <div className="text-6xl mb-6 opacity-40">🛣️</div>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">
                    {t('booking.no_bookings') || 'Aucun voyage prévu'}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">
                    Prêt pour votre prochaine aventure ? Découvrez nos véhicules premium.
                  </p>
                  <Link to="/listings" className="btn-primary px-8">
                    {t('nav.listings') || 'Explorer les véhicules'}
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
                    <div className="mt-12">
                      <div className="flex items-center gap-4 mb-6">
                        <span className="flex-1 border-t border-white/10" />
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
                          {t('booking.history') || 'Historique'}
                        </span>
                        <span className="flex-1 border-t border-white/10" />
                      </div>
                      <div className="space-y-4 opacity-60 hover:opacity-100 transition-opacity duration-500">
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
            <div className="space-y-6">
              {active.length === 0 && past.length === 0 ? (
                <div className="text-center py-24 bg-luxuryDark rounded-[40px] border border-white/5 border-dashed">
                  <div className="text-6xl mb-6 opacity-40">📬</div>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">
                    {t('booking.no_received') || 'Aucune demande'}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto text-sm">
                    Vous n'avez pas encore reçu de demande de location pour vos véhicules.
                  </p>
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
                    <div className="mt-12">
                      <div className="flex items-center gap-4 mb-6">
                        <span className="flex-1 border-t border-white/10" />
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
                          {t('booking.history') || 'Historique'}
                        </span>
                        <span className="flex-1 border-t border-white/10" />
                      </div>
                      <div className="space-y-4 opacity-60 hover:opacity-100 transition-opacity duration-500">
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
    </div>
  );
}