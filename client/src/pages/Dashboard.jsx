import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../App';
import { imgUrl } from '../utils/imageUrl';
import {
  BanknotesIcon,
  CalendarDaysIcon,
  BellAlertIcon,
  ChartBarIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Badges assombris pour coller au thème
const STATUS_COLORS = {
  pending: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  confirmed: 'bg-gnGreen/10 text-gnGreen border-gnGreen/20',
  rejected: 'bg-gnRed/10 text-gnRed border-gnRed/20',
  cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

function formatCurrency(val) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(val || 0) + ' GNF';
}

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString();
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'short' });
    months.push({ key, label });
  }
  return months;
}

function StarRating({ value }) {
  if (!value) return <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">—</span>;
  return (
    <span className="flex items-center justify-end gap-1 text-[11px] font-black text-gnYellow">
      <StarIcon className="h-3.5 w-3.5 fill-gnYellow text-gnYellow" />
      {Number(value).toFixed(1)}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, colorClass, iconColor }) {
  return (
    <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-6 flex items-start gap-4 hover:bg-white/5 transition-colors group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
        <Icon className={`h-6 w-6 ${iconColor} group-hover:scale-110 transition-transform`} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-display font-black text-white leading-tight">{value}</p>
        {sub && <p className="text-[10px] font-medium text-gray-500 mt-1 uppercase tracking-wider">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwner = user && (user.role === 'owner' || user.role === 'both');

  useEffect(() => {
    if (!isOwner) return;
    axios.get('/api/dashboard')
      .then(res => setData(res.data))
      .catch(() => setError(t('common.error')))
      .finally(() => setLoading(false));
  }, [isOwner, t]);

  if (!isOwner) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-white/5 rounded-2xl w-64 border border-white/5" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 rounded-3xl border border-white/5" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-64 bg-white/5 rounded-3xl border border-white/5" />
              <div className="h-64 bg-white/5 rounded-3xl border border-white/5" />
            </div>
            <div className="h-80 bg-white/5 rounded-3xl border border-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter mb-8">{t('dashboard.title') || 'Tableau de bord'}</h1>
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-16 text-center">
            <p className="text-5xl mb-6 opacity-40">📊</p>
            <p className="text-gray-400 mb-8 font-medium">{t('dashboard.load_error')}</p>
            <button onClick={() => window.location.reload()} className="btn-primary px-10">
              {t('dashboard.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary, cars, monthly_revenue, recent_bookings } = data;

  // Build chart data with 0-fill for missing months
  const months = getLast6Months();
  const chartData = months.map(m => {
    const found = monthly_revenue.find(r => r.month === m.key);
    return { ...m, revenue: found?.revenue || 0, bookings: found?.bookings || 0 };
  });
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <div className="bg-luxuryBlack min-h-screen pt-12 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter mb-2">
            {t('dashboard.title') || 'Tableau de bord'}
          </h1>
          <p className="text-gnYellow font-bold text-[10px] uppercase tracking-widest">
            {t('dashboard.welcome') || 'Bienvenue'}, <span className="text-white">{user.name}</span>
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            icon={BanknotesIcon}
            label={t('dashboard.total_revenue') || 'Revenus globaux'}
            value={formatCurrency(summary.total_revenue)}
            sub={`${summary.confirmed_bookings} ${t('dashboard.confirmed_bookings_short') || 'confirmées'}`}
            colorClass="bg-gnYellow/10 border-gnYellow/20"
            iconColor="text-gnYellow"
          />
          <KpiCard
            icon={CalendarDaysIcon}
            label={t('dashboard.month_revenue') || 'Revenus du mois'}
            value={formatCurrency(summary.month_revenue)}
            sub={t('dashboard.this_month') || 'Ce mois-ci'}
            colorClass="bg-white/5 border-white/10"
            iconColor="text-white"
          />
          <KpiCard
            icon={BellAlertIcon}
            label={t('dashboard.pending') || 'En attente'}
            value={summary.pending_bookings}
            sub={summary.pending_bookings > 0 ? (t('dashboard.action_needed') || 'Action requise') : (t('dashboard.all_clear') || 'Tout est à jour')}
            colorClass="bg-orange-500/10 border-orange-500/20"
            iconColor="text-orange-500"
          />
          <KpiCard
            icon={ChartBarIcon}
            label={t('dashboard.occupancy') || 'Taux d\'occupation'}
            value={`${summary.global_occupancy_rate}%`}
            sub={`${summary.active_cars}/${summary.total_cars} ${t('dashboard.cars_active') || 'véhicules actifs'}`}
            colorClass="bg-blue-500/10 border-blue-500/20"
            iconColor="text-blue-500"
          />
        </div>

        {/* Revenue Chart + Rating */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Monthly Revenue Chart */}
          <div className="lg:col-span-2 bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-8 pb-4 border-b border-white/5">
              {t('dashboard.revenue_chart') || 'Évolution des revenus'}
            </h2>
            <div className="flex items-end justify-between gap-4 h-48">
              {chartData.map((d) => (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-2 group cursor-crosshair">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 px-2 py-1 rounded-lg">
                    {new Intl.NumberFormat('fr-FR', { notation: "compact", compactDisplay: "short" }).format(d.revenue)}
                  </span>
                  <div className="w-full flex items-end justify-center h-full">
                    <div
                      className="w-full max-w-[48px] bg-gradient-to-t from-[#D4AF37]/20 to-gnYellow rounded-t-xl group-hover:brightness-125 transition-all duration-500"
                      style={{ height: `${Math.max(4, Math.round((d.revenue / maxRevenue) * 100))}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rating + Quick Stats */}
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-8 pb-4 border-b border-white/5">
                {t('dashboard.your_stats') || 'Statistiques Propriétaire'}
              </h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('dashboard.avg_rating') || 'Note moyenne'}</span>
                  {summary.avg_owner_rating
                    ? <span className="flex items-center gap-1.5 font-black text-lg text-white">
                        {Number(summary.avg_owner_rating).toFixed(1)}
                        <StarIcon className="h-4 w-4 fill-gnYellow text-gnYellow mb-0.5" />
                        <span className="text-[10px] text-gray-500 font-bold ml-1">({summary.total_reviews})</span>
                      </span>
                    : <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{t('dashboard.not_rated') || 'Non noté'}</span>
                  }
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('dashboard.total_bookings') || 'Total réservations'}</span>
                  <span className="font-black text-white text-lg">{summary.total_bookings}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 mt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gnGreen uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircleIcon className="h-4 w-4" /> {t('dashboard.confirmed') || 'Confirmées'}
                </span>
                <span className="font-black text-gnGreen">{summary.confirmed_bookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4" /> {t('dashboard.pending') || 'En attente'}
                </span>
                <span className="font-black text-orange-400">{summary.pending_bookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gnRed uppercase tracking-widest flex items-center gap-1.5">
                  <XCircleIcon className="h-4 w-4" /> {t('dashboard.cancelled') || 'Annulées'}
                </span>
                <span className="font-black text-gnRed">{summary.cancelled_bookings}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cars Performance */}
        {cars.length > 0 && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex items-center gap-3">
              <ArrowTrendingUpIcon className="h-5 w-5 text-gnYellow" />
              <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest">{t('dashboard.performance') || 'Performances des véhicules'}</h2>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/40 text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                    <th className="px-8 py-4 text-left">{t('dashboard.car') || 'Véhicule'}</th>
                    <th className="px-6 py-4 text-right">{t('dashboard.revenue') || 'Revenus'}</th>
                    <th className="px-6 py-4 text-center">{t('dashboard.bookings_count') || 'Vols'}</th>
                    <th className="px-6 py-4 text-right">{t('dashboard.rating') || 'Note'}</th>
                    <th className="px-8 py-4 text-left min-w-[160px]">{t('dashboard.occupancy') || 'Occupation'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {cars.map(car => (
                    <tr key={car.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-5">
                        <Link to={`/cars/${car.id}`} className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/5">
                            {car.images && car.images[0]
                              ? <img src={imgUrl(car.images[0])} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              : <span className="w-full h-full flex items-center justify-center text-xl">🚗</span>
                            }
                          </div>
                          <div>
                            <p className="font-black text-white group-hover:text-gnYellow transition-colors uppercase tracking-wider text-xs mb-1">
                              {car.title || `${car.brand} ${car.model}`}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500 tracking-widest">{new Intl.NumberFormat().format(car.price_per_day)} GNF/j</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-white text-xs tracking-wider">
                        {formatCurrency(car.revenue)}
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-gray-400">
                        {car.booking_count}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <StarRating value={car.avg_rating} />
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div
                              className="bg-gnYellow h-full rounded-full shadow-[0_0_10px_rgba(252,209,22,0.8)]"
                              style={{ width: `${car.occupancy_rate}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-black text-white w-8 text-right">{car.occupancy_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Bookings */}
        {recent_bookings.length > 0 && (
          <div className="bg-luxuryDark rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest">{t('dashboard.recent') || 'Activité récente'}</h2>
              <Link to="/my-bookings" className="text-[10px] font-black text-white hover:text-gnYellow uppercase tracking-widest transition-colors border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5">
                {t('dashboard.see_all') || 'Voir tout'}
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {recent_bookings.map(b => (
                <div key={b.id} className="px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                  <div className="flex flex-col gap-1 min-w-[200px]">
                    <span className="font-black text-white text-xs uppercase tracking-wider">
                      {b.car_title || `${b.brand} ${b.model}`}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{b.renter_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {formatDate(b.start_date)} <span className="opacity-50">→</span> {formatDate(b.end_date)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 min-w-[250px]">
                    <span className="font-black text-white text-xs tracking-wider">{formatCurrency(b.total_price)}</span>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-widest border ${STATUS_COLORS[b.status]}`}>
                      {t(`booking.status_${b.status}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {cars.length === 0 && (
          <div className="text-center py-24 bg-luxuryDark rounded-[40px] border border-white/5 border-dashed">
            <p className="text-gray-500 mb-6 text-sm">{t('dashboard.no_cars') || "Vous n'avez pas encore de véhicules."}</p>
            <Link to="/post-listing" className="btn-primary px-10">{t('nav.post_listing') || 'Publier une annonce'}</Link>
          </div>
        )}
      </div>
    </div>
  );
}