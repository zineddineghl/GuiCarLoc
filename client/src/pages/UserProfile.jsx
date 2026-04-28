import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../App';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PhoneIcon,
  CalendarIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

const CAR_TYPE_ICONS = {
  sedan: '🚗', suv: '🚙', van: '🚐', sports: '🏎️', luxury: '🚘', economy: '🚕'
};

const ROLE_COLORS = {
  owner: 'bg-blue-100 text-blue-700',
  renter: 'bg-green-100 text-green-700',
  both: 'bg-purple-100 text-purple-700',
};

const AVATAR_COLORS = [
  'bg-primary-500', 'bg-purple-500', 'bg-green-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500'
];

function Avatar({ name, avatarFile, size = 'lg', onClick, isOwn }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const sizeClass = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-12 h-12 text-lg';

  return (
    <div
      className={`relative flex-shrink-0 ${isOwn ? 'cursor-pointer group' : ''}`}
      onClick={isOwn ? onClick : undefined}
    >
      {avatarFile ? (
        <img
          src={`/uploads/${avatarFile}`}
          alt={name}
          className={`${sizeClass} rounded-full object-cover`}
        />
      ) : (
        <div className={`${color} ${sizeClass} rounded-full flex items-center justify-center text-white font-bold`}>
          {initials}
        </div>
      )}
      {isOwn && (
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <CameraIcon className="h-7 w-7 text-white" />
        </div>
      )}
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [twoFaMessage, setTwoFaMessage] = useState('');

  const isOwn = authUser && String(authUser.id) === String(id);

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/users/${id}`)
      .then(res => {
        setProfile(res.data.user);
        setListings(res.data.listings || []);
        setReviews(res.data.reviews || []);
        setEditForm({
          name: res.data.user.name || '',
          bio: res.data.user.bio || '',
          phone: res.data.user.phone || '',
        });
      })
      .catch(err => {
        if (err.response?.status === 404) setError(t('profile.not_found'));
        else setError(t('common.error'));
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await axios.post('/api/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(prev => ({ ...prev, avatar: res.data.avatar }));
    } catch {
      // silently fail
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await axios.put('/api/users/me', editForm);
      setProfile(prev => ({ ...prev, ...res.data.user }));
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.error || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    setToggling2FA(true);
    setTwoFaMessage('');
    try {
      const res = await axios.put('/api/users/me/2fa');
      setProfile(prev => ({ ...prev, two_fa_enabled: res.data.two_fa_enabled }));
      setTwoFaMessage(res.data.two_fa_enabled ? t('profile.two_fa_enabled_msg') : t('profile.two_fa_disabled_msg'));
    } catch {
      // silently fail
    } finally {
      setToggling2FA(false);
    }
  };

  const memberSince = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'long', year: 'numeric'
    });
  };

  const roleLabel = {
    owner: t('profile.role_owner'),
    renter: t('profile.role_renter'),
    both: t('profile.role_both'),
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || t('profile.not_found')}</h2>
        <button onClick={() => navigate(-1)} className="btn-primary">{t('common.back')}</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-1">
            <Avatar
              name={profile.name}
              avatarFile={profile.avatar}
              size="lg"
              isOwn={isOwn}
              onClick={handleAvatarClick}
            />
            {avatarUploading && (
              <span className="text-xs text-primary-600 animate-pulse">
                {t('common.loading')}
              </span>
            )}
            {isOwn && !avatarUploading && (
              <button
                onClick={handleAvatarClick}
                className="text-xs text-gray-400 hover:text-primary-600 transition-colors mt-1"
              >
                {t('profile.change_photo')}
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="form-label text-xs">{t('auth.name')}</label>
                  <input
                    className="input-field"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label text-xs">{t('profile.bio')}</label>
                  <textarea
                    className="input-field resize-none"
                    rows={3}
                    placeholder={t('profile.bio_placeholder')}
                    value={editForm.bio}
                    onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label text-xs">{t('auth.phone')}</label>
                  <input
                    className="input-field"
                    value={editForm.phone}
                    onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm flex items-center gap-1">
                    <CheckIcon className="h-4 w-4" />
                    {saving ? t('common.loading') : t('common.save')}
                  </button>
                  <button onClick={() => { setEditing(false); setSaveError(''); }} className="btn-secondary btn-sm flex items-center gap-1">
                    <XMarkIcon className="h-4 w-4" />
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[profile.role]}`}>
                        {roleLabel[profile.role]}
                      </span>
                      {profile.avg_owner_rating && (
                        <span className="flex items-center gap-1 text-sm">
                          <span className="text-yellow-400">★</span>
                          <span className="font-semibold text-gray-800">{profile.avg_owner_rating}</span>
                          <span className="text-gray-400">({profile.review_count})</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwn ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    >
                      <PencilIcon className="h-4 w-4" />
                      {t('common.edit')}
                    </button>
                  ) : authUser && (
                    <Link
                      to={`/messages/${id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-primary-200"
                    >
                      {t('messages.contact')}
                    </Link>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{t('profile.member_since')} {memberSince(profile.created_at)}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center gap-1.5">
                      <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                {profile.bio ? (
                  <p className="mt-4 text-gray-600 leading-relaxed text-sm">{profile.bio}</p>
                ) : isOwn ? (
                  <p className="mt-4 text-gray-400 text-sm italic">{t('profile.bio_empty')}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{profile.listings_count}</div>
            <div className="text-xs text-gray-500 mt-0.5">{t('profile.stat_listings')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {profile.avg_owner_rating ? `${profile.avg_owner_rating}★` : '—'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{t('profile.stat_rating')}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{profile.review_count}</div>
            <div className="text-xs text-gray-500 mt-0.5">{t('profile.stat_reviews')}</div>
          </div>
        </div>
      </div>

      {/* Security (2FA) - own profile only */}
      {isOwn && (
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">{t('profile.security_title')}</h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-800">{t('profile.two_fa_title')}</p>
              <p className="text-sm text-gray-500 mt-0.5">{t('profile.two_fa_desc')}</p>
            </div>
            <button
              onClick={handleToggle2FA}
              disabled={toggling2FA}
              aria-pressed={!!profile.two_fa_enabled}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                profile.two_fa_enabled ? 'bg-primary-600' : 'bg-gray-200'
              } ${toggling2FA ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                profile.two_fa_enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          {twoFaMessage && (
            <p className="text-sm text-green-600 mt-3">{twoFaMessage}</p>
          )}
        </div>
      )}

      {/* Listings */}
      {listings.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">{t('profile.listings_title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {listings.map(car => (
              <Link key={car.id} to={`/cars/${car.id}`} className="group block">
                <div className="rounded-xl overflow-hidden border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all">
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    {car.images && car.images.length > 0 ? (
                      <img
                        src={`/uploads/${car.images[0]}`}
                        alt={car.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
                        {CAR_TYPE_ICONS[car.type] || '🚗'}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm text-gray-900 truncate">{car.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-primary-700 font-bold text-sm">
                        {car.price_per_day} GNF<span className="text-gray-400 font-normal">/j</span>
                      </span>
                      {car.avg_car_rating && (
                        <span className="text-xs text-gray-500">★ {car.avg_car_rating}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{car.city}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews received */}
      {reviews.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4">
            {t('profile.reviews_title')}
            <span className="ml-2 text-sm font-normal text-gray-400">({reviews.length})</span>
          </h2>
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{review.reviewer_name}</span>
                    <Link to={`/cars/${review.car_id}`} className="ml-2 text-xs text-primary-600 hover:underline">
                      {review.car_title}
                    </Link>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(review.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-1.5 text-xs text-gray-500">
                  <span className="flex items-center gap-0.5">
                    🚗 {'★★★★★'.split('').map((_, i) => (
                      <span key={i} className={i < review.car_rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                    ))}
                  </span>
                  <span className="flex items-center gap-0.5">
                    👤 {'★★★★★'.split('').map((_, i) => (
                      <span key={i} className={i < review.owner_rating ? 'text-yellow-400' : 'text-gray-200'}>★</span>
                    ))}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {reviews.length === 0 && listings.length === 0 && (
        <div className="card p-10 text-center text-gray-400">
          <div className="text-5xl mb-3">👤</div>
          <p>{t('profile.no_activity')}</p>
        </div>
      )}
    </div>
  );
}
