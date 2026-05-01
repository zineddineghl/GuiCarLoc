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
} from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
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
  if (!value) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className="flex items-center gap-0.5 text-sm font-semibold text-yellow-600">
      <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      {Number(value).toFixed(1)}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-48 bg-gray-100 rounded-2xl" />
            <div className="h-48 bg-gray-100 rounded-2xl" />
          </div>
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('dashboard.title')}</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <p className="text-4xl mb-4">📊</p>
          <p className="text-gray-500 mb-6">{t('dashboard.load_error')}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            {t('dashboard.retry')}
          </button>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {t('dashboard.welcome')}, <span className="font-medium text-gray-700">{user.name}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={BanknotesIcon}
          label={t('dashboard.total_revenue')}
          value={formatCurrency(summary.total_revenue)}
          sub={`${summary.confirmed_bookings} ${t('dashboard.confirmed_bookings_short')}`}
          color="bg-primary-50 text-primary-600"
        />
        <KpiCard
          icon={CalendarDaysIcon}
          label={t('dashboard.month_revenue')}
          value={formatCurrency(summary.month_revenue)}
          sub={t('dashboard.this_month')}
          color="bg-green-50 text-green-600"
        />
        <KpiCard
          icon={BellAlertIcon}
          label={t('dashboard.pending')}
          value={summary.pending_bookings}
          sub={summary.pending_bookings > 0 ? t('dashboard.action_needed') : t('dashboard.all_clear')}
          color="bg-orange-50 text-orange-500"
        />
        <KpiCard
          icon={ChartBarIcon}
          label={t('dashboard.occupancy')}
          value={`${summary.global_occupancy_rate}%`}
          sub={`${summary.active_cars}/${summary.total_cars} ${t('dashboard.cars_active')}`}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Revenue Chart + Rating */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">{t('dashboard.revenue_chart')}</h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {chartData.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  {formatCurrency(d.revenue)}
                </span>
                <div className="w-full flex items-end justify-center">
                  <div
                    className="w-full max-w-[40px] bg-primary-500 rounded-t-lg hover:bg-primary-600 transition-colors"
                    style={{ height: `${Math.max(4, Math.round((d.revenue / maxRevenue) * 128))}px` }}
                    title={`${d.label}: ${formatCurrency(d.revenue)}`}
                  />
                </div>
                <span className="text-xs text-gray-400 capitalize">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rating + Quick Stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">{t('dashboard.your_stats')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('dashboard.avg_rating')}</span>
              {summary.avg_owner_rating
                ? <span className="flex items-center gap-1 font-bold text-yellow-600">
                    <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {Number(summary.avg_owner_rating).toFixed(1)}
                    <span className="text-xs text-gray-400 font-normal">({summary.total_reviews})</span>
                  </span>
                : <span className="text-sm text-gray-400">{t('dashboard.not_rated')}</span>
              }
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t('dashboard.total_bookings')}</span>
              <span className="font-semibold text-gray-900">{summary.total_bookings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <CheckCircleIcon className="h-3.5 w-3.5 text-green-500" />
                {t('dashboard.confirmed')}
              </span>
              <span className="font-semibold text-green-700">{summary.confirmed_bookings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <XCircleIcon className="h-3.5 w-3.5 text-red-400" />
                {t('dashboard.cancelled')}
              </span>
              <span className="font-semibold text-red-600">{summary.cancelled_bookings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <ClockIcon className="h-3.5 w-3.5 text-orange-400" />
                {t('dashboard.pending')}
              </span>
              <span className="font-semibold text-orange-600">{summary.pending_bookings}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cars Performance */}
      {cars.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-base font-semibold text-gray-900">{t('dashboard.performance')}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">{t('dashboard.car')}</th>
                  <th className="px-4 py-3 text-right">{t('dashboard.revenue')}</th>
                  <th className="px-4 py-3 text-right">{t('dashboard.bookings_count')}</th>
                  <th className="px-4 py-3 text-right">{t('dashboard.rating')}</th>
                  <th className="px-6 py-3 text-left min-w-[160px]">{t('dashboard.occupancy')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cars.map(car => (
                  <tr key={car.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/cars/${car.id}`} className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {car.images && car.images[0]
                            ? <img src={imgUrl(car.images[0])} alt="" className="w-full h-full object-cover" />
                            : <span className="w-full h-full flex items-center justify-center text-lg">🚗</span>
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
                            {car.title || `${car.brand} ${car.model}`}
                          </p>
                          <p className="text-xs text-gray-400">{car.price_per_day} GNF/jour</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-gray-900">
                      {formatCurrency(car.revenue)}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-600">{car.booking_count}</td>
                    <td className="px-4 py-4 text-right">
                      <StarRating value={car.avg_rating} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${car.occupancy_rate}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8 text-right">{car.occupancy_rate}%</span>
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">{t('dashboard.recent')}</h2>
            <Link to="/my-bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              {t('dashboard.see_all')}
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recent_bookings.map(b => (
              <div key={b.id} className="px-6 py-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-medium text-gray-900 min-w-[150px]">
                  {b.car_title || `${b.brand} ${b.model}`}
                </span>
                <span className="text-sm text-gray-500">{b.renter_name}</span>
                <span className="text-xs text-gray-400">
                  {formatDate(b.start_date)} → {formatDate(b.end_date)}
                </span>
                <span className="ml-auto font-semibold text-gray-900">{formatCurrency(b.total_price)}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[b.status]}`}>
                  {t(`booking.status_${b.status}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cars.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">{t('dashboard.no_cars')}</p>
          <Link to="/post-listing" className="btn-primary">{t('nav.post_listing')}</Link>
        </div>
      )}
    </div>
  );
}
