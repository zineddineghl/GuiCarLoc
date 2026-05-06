import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../App';
import { imgUrl } from '../utils/imageUrl';
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PhoneIcon,
  CalendarIcon,
  CameraIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const CAR_TYPE_ICONS = {
  sedan: '🚗', suv: '🚙', van: '🚐', sports: '🏎️', luxury: '🚘', compact: '🚕'
};

// Badges adaptés au mode sombre
const ROLE_COLORS = {
  owner: 'bg-gnYellow/10 text-gnYellow border-gnYellow/20',
  renter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  both: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const AVATAR_COLORS = [
  'bg-blue-900', 'bg-purple-900', 'bg-emerald-900',
  'bg-orange-900', 'bg-rose-900', 'bg-teal-900'
];

function Avatar({ name, avatarFile, size = 'lg', onClick, isOwn }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const color = AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const sizeClass = size === 'lg' ? 'w-28 h-28 text-4xl' : 'w-12 h-12 text-lg';

  return (
    <div
      className={`relative flex-shrink-0 ${isOwn ? 'cursor-pointer group' : ''}`}
      onClick={isOwn ? onClick : undefined}
    >
      {avatarFile ? (
        <img
          src={imgUrl(avatarFile)}
          alt={name}
          className={`${sizeClass} rounded-full object-cover border-2 border-white/10 shadow-xl`}
        />
      ) : (
        <div className={`${color} ${sizeClass} rounded-full flex items-center justify-center text-white font-black border-2 border-white/10 shadow-xl`}>
          {initials}
        </div>
      )}
      {isOwn && (
        <div className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center border-2 border-gnYellow/50">
          <CameraIcon className="h-8 w-8 text-gnYellow mb-1" />
          <span className="text-[9px] font-bold text-white uppercase tracking-widest">Modifier</span>
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
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await axios.delete('/api/users/me');
      localStorage.removeItem('token');
      navigate('/');
      window.location.reload();
    } catch {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  const memberSince = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US', {
      month: 'long', year: 'numeric'
    });
  };

  const roleLabel = {
    owner: t('profile.role_owner') || 'Propriétaire',
    renter: t('profile.role_renter') || 'Locataire',
    both: t('profile.role_both') || 'Propriétaire & Locataire',
  };

  if (loading) {
    return (
      <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gnYellow"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center bg-luxuryDark rounded-[40px] border border-white/5">
          <div className="text-6xl mb-6 opacity-40">👤</div>
          <h2 className="text-2xl font-display font-bold text-white mb-8">{error || t('profile.not_found')}</h2>
          <button onClick={() => navigate(-1)} className="btn-primary px-8">{t('common.back')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        {/* Profile Card */}
        <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8 relative overflow-hidden">
          {/* Décoration subtile en arrière-plan */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row gap-8 relative z-10">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2">
              <Avatar
                name={profile.name}
                avatarFile={profile.avatar}
                size="lg"
                isOwn={isOwn}
                onClick={handleAvatarClick}
              />
              {avatarUploading && (
                <span className="text-[10px] font-bold text-gnYellow uppercase tracking-widest animate-pulse mt-2">
                  {t('common.loading') || 'Chargement...'}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-4 bg-black/40 p-6 rounded-2xl border border-white/10">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('auth.name')}</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('profile.bio')}</label>
                    <textarea
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none resize-none"
                      rows={3}
                      placeholder={t('profile.bio_placeholder')}
                      value={editForm.bio}
                      onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('auth.phone')}</label>
                    <input
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none"
                      value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  {saveError && <p className="text-gnRed text-xs font-bold bg-gnRed/10 p-3 rounded-lg border border-gnRed/20">{saveError}</p>}
                  
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-6 flex items-center gap-2 flex-1 sm:flex-none justify-center">
                      <CheckIcon className="h-4 w-4" />
                      {saving ? (t('common.loading') || 'Chargement...') : (t('common.save') || 'Enregistrer')}
                    </button>
                    <button onClick={() => { setEditing(false); setSaveError(''); }} className="py-2.5 px-6 flex items-center gap-2 flex-1 sm:flex-none justify-center text-[10px] font-bold uppercase tracking-widest text-gray-400 border border-white/20 rounded-lg hover:bg-white/10 transition-colors">
                      <XMarkIcon className="h-4 w-4" />
                      {t('common.cancel') || 'Annuler'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tighter">{profile.name}</h1>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md border ${ROLE_COLORS[profile.role]}`}>
                          {roleLabel[profile.role]}
                        </span>
                        {profile.id_status === 'verified' ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md border border-gnGreen/40 bg-gnGreen/10 text-gnGreen">
                            ✓ Identité vérifiée
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md border border-white/10 bg-white/5 text-gray-500">
                            Identité non vérifiée
                          </span>
                        )}
                        {profile.avg_owner_rating && (
                          <span className="flex items-center gap-1.5 text-sm bg-white/5 px-3 py-1.5 rounded-md border border-white/5">
                            <span className="text-gnYellow mb-0.5">★</span>
                            <span className="font-black text-white">{Number(profile.avg_owner_rating).toFixed(1)}</span>
                            <span className="text-[10px] font-bold text-gray-500 tracking-widest">({profile.review_count})</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {isOwn ? (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                      >
                        <PencilIcon className="h-4 w-4 text-gnYellow" />
                        {t('common.edit') || 'Modifier'}
                      </button>
                    ) : authUser && (
                      <Link
                        to={`/messages/${id}`}
                        className="btn-primary flex items-center gap-2 px-6 py-2.5"
                      >
                        {t('messages.contact') || 'Contacter'}
                      </Link>
                    )}
                  </div>

                  <div className="mt-6 space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span>{t('profile.member_since') || 'Membre depuis'} <span className="text-gray-300 font-medium">{memberSince(profile.created_at)}</span></span>
                    </div>
                    {profile.phone && (
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-300">{profile.phone}</span>
                      </div>
                    )}
                  </div>

                  {profile.bio ? (
                    <div className="mt-6 p-4 bg-black/30 rounded-xl border border-white/5">
                      <p className="text-gray-300 leading-relaxed text-sm italic">"{profile.bio}"</p>
                    </div>
                  ) : isOwn ? (
                    <p className="mt-6 text-gray-500 text-sm italic">{t('profile.bio_empty') || 'Ajoutez une bio pour vous présenter.'}</p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-4 text-center relative z-10">
            <div className="group">
              <div className="text-3xl font-display font-black text-white group-hover:text-gnYellow transition-colors">{profile.listings_count}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{t('profile.stat_listings') || 'Annonces'}</div>
            </div>
            <div className="group border-x border-white/5">
              <div className="text-3xl font-display font-black text-white group-hover:text-gnYellow transition-colors">
                {profile.avg_owner_rating ? `${Number(profile.avg_owner_rating).toFixed(1)}` : '—'}
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{t('profile.stat_rating') || 'Note Moyenne'}</div>
            </div>
            <div className="group">
              <div className="text-3xl font-display font-black text-white group-hover:text-gnYellow transition-colors">{profile.review_count}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">{t('profile.stat_reviews') || 'Avis Reçus'}</div>
            </div>
          </div>
        </div>

        {/* Security (2FA) - own profile only */}
        {isOwn && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <ShieldCheckIcon className="h-6 w-6 text-gnYellow" />
              <h2 className="font-display font-black text-xl text-white uppercase tracking-wider">{t('profile.security_title') || 'Sécurité'}</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <p className="font-bold text-white text-sm">{t('profile.two_fa_title') || 'Authentification à double facteur (2FA)'}</p>
                <p className="text-xs text-gray-500 mt-1 max-w-lg leading-relaxed">{t('profile.two_fa_desc') || 'Protégez votre compte en recevant un code par email à chaque connexion.'}</p>
              </div>
              <button
                onClick={handleToggle2FA}
                disabled={toggling2FA}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none border border-white/10 ${
                  profile.two_fa_enabled ? 'bg-gnYellow' : 'bg-black/50'
                } ${toggling2FA ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                  profile.two_fa_enabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
            {twoFaMessage && (
              <div className="mt-4 p-3 bg-gnGreen/10 border border-gnGreen/20 rounded-xl">
                <p className="text-xs font-bold text-gnGreen uppercase tracking-widest">{twoFaMessage}</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-white text-sm">Supprimer mon compte</p>
                <p className="text-xs text-gray-500 mt-1">Cette action est irréversible. Toutes vos données seront supprimées.</p>
              </div>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  Supprimer le compte
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-red-400 font-bold">Confirmer ?</span>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {deletingAccount ? 'Suppression...' : 'Oui, supprimer'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/20 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listings */}
        {listings.length > 0 && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6 pb-4 border-b border-white/5">
              {t('profile.listings_title') || 'Véhicules proposés'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {listings.map(car => (
                <Link key={car.id} to={`/cars/${car.id}`} className="group block">
                  <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/40 hover:border-gnYellow/50 transition-all duration-300 shadow-lg">
                    <div className="h-40 bg-black relative overflow-hidden">
                      {car.images && car.images.length > 0 ? (
                        <img
                          src={imgUrl(car.images[0])}
                          alt={car.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">
                          {CAR_TYPE_ICONS[car.type] || '🚗'}
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                        <span className="text-[10px] font-bold text-gnYellow uppercase tracking-widest">
                          {car.price_per_day} GNF/j
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-black text-sm text-white truncate mb-1">{car.title}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                          {car.city}
                        </p>
                        {car.avg_car_rating && (
                          <span className="text-[10px] font-black text-white flex items-center gap-1">
                            <StarIcon className="h-3 w-3 text-gnYellow fill-gnYellow" /> {Number(car.avg_car_rating).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Reviews received */}
        {reviews.length > 0 && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6 pb-4 border-b border-white/5 flex items-center justify-between">
              {t('profile.reviews_title') || 'Avis reçus'}
              <span className="bg-white/10 text-white px-2 py-1 rounded-md text-[9px]">{reviews.length}</span>
            </h2>
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="border-b border-white/5 last:border-0 pb-6 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-black text-white text-sm">{review.reviewer_name}</span>
                      <span className="text-gray-500 text-xs mx-2">•</span>
                      <Link to={`/cars/${review.car_id}`} className="text-[10px] font-bold text-gnYellow uppercase tracking-widest hover:text-white transition-colors">
                        {review.car_title}
                      </Link>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex-shrink-0">
                      {new Date(review.created_at).toLocaleDateString(i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-3 text-xs">
                    <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                      <span className="text-gray-500 mr-1">🚗</span>
                      {'★★★★★'.split('').map((_, i) => (
                        <span key={`car-${i}`} className={i < review.car_rating ? 'text-gnYellow' : 'text-gray-700'}>★</span>
                      ))}
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                      <span className="text-gray-500 mr-1">👤</span>
                      {'★★★★★'.split('').map((_, i) => (
                        <span key={`owner-${i}`} className={i < review.owner_rating ? 'text-gnYellow' : 'text-gray-700'}>★</span>
                      ))}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-300 italic leading-relaxed bg-black/20 p-4 rounded-xl border-l-2 border-gnYellow">"{review.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {reviews.length === 0 && listings.length === 0 && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-16 text-center text-gray-500">
            <div className="text-5xl mb-4 opacity-30">👤</div>
            <p className="text-sm font-medium">{t('profile.no_activity') || 'Aucune activité pour le moment.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}