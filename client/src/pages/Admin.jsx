import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import {
  UsersIcon,
  TruckIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

const TABS = [
  { id: 'stats', label: 'Stats globales' },
  { id: 'users', label: 'Utilisateurs' },
  { id: 'cars', label: 'Annonces' },
  { id: 'bookings', label: 'Réservations' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary-700' }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="p-3 bg-gray-50 rounded-xl">
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Pagination({ page, total, limit, onPage }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <span>{total} résultat{total > 1 ? 's' : ''}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span>Page {page} / {totalPages}</span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── STATS TAB ────────────────────────────────────────────────────────────────

function StatsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/stats')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;
  if (!data) return <p className="text-center text-gray-500 py-8">Erreur de chargement</p>;

  const { summary, recent_bookings, recent_users } = data;

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UsersIcon} label="Utilisateurs" value={summary.total_users} sub={`+${summary.new_users_month} ce mois`} />
        <StatCard icon={TruckIcon} label="Annonces" value={summary.total_cars} sub={`${summary.active_cars} actives`} color="text-green-600" />
        <StatCard icon={CalendarDaysIcon} label="Réservations" value={summary.total_bookings} sub={`${summary.pending_bookings} en attente`} color="text-yellow-600" />
        <StatCard icon={CurrencyDollarIcon} label="Revenus confirmés" value={`${summary.total_revenue.toLocaleString()} GNF`} sub={`${summary.month_revenue.toLocaleString()} GNF ce mois`} color="text-emerald-600" />
      </div>

      {summary.banned_users > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
          {summary.banned_users} compte{summary.banned_users > 1 ? 's' : ''} suspendu{summary.banned_users > 1 ? 's' : ''}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Dernières réservations</h3>
          <div className="space-y-3">
            {recent_bookings.map(b => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{b.car_title}</p>
                  <p className="text-xs text-gray-400">{b.renter_name} → {b.owner_name}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status]}`}>
                    {b.status}
                  </span>
                  <span className="text-gray-600 font-medium">{b.total_price?.toLocaleString()} GNF</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 mb-4">Dernières inscriptions</h3>
          <div className="space-y-3">
            {recent_users.map(u => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className="ml-3 flex-shrink-0 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [bannedFilter, setBannedFilter] = useState('');
  const [confirm, setConfirm] = useState(null); // { action, userId, userName }

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    if (bannedFilter !== '') params.banned = bannedFilter;
    axios.get('/api/admin/users', { params })
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, roleFilter, bannedFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const update = async (userId, payload) => {
    await axios.put(`/api/admin/users/${userId}`, payload);
    fetchUsers();
  };

  const deleteUser = async (userId) => {
    await axios.delete(`/api/admin/users/${userId}`);
    setConfirm(null);
    fetchUsers();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher nom ou email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9 py-2 text-sm w-full"
          />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }} className="input-field py-2 text-sm">
          <option value="">Tous les rôles</option>
          <option value="owner">Propriétaire</option>
          <option value="renter">Locataire</option>
          <option value="both">Les deux</option>
        </select>
        <select value={bannedFilter} onChange={e => { setBannedFilter(e.target.value); setPage(1); }} className="input-field py-2 text-sm">
          <option value="">Tous statuts</option>
          <option value="0">Actifs</option>
          <option value="1">Suspendus</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Utilisateur</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Rôle</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Annonces</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Réservations</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Admin</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Inscrit le</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Chargement...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">Aucun utilisateur</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{u.car_count}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{u.booking_count}</td>
                  <td className="px-4 py-3 text-center">
                    {u.banned ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Suspendu</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Actif</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.is_admin ? <ShieldCheckIcon className="h-5 w-5 text-primary-600 mx-auto" /> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    {u.id !== me?.id && (
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => update(u.id, { banned: u.banned ? 0 : 1 })}
                          title={u.banned ? 'Réactiver' : 'Suspendre'}
                          className={`p-1.5 rounded-lg transition-colors ${u.banned ? 'text-green-600 hover:bg-green-50' : 'text-yellow-600 hover:bg-yellow-50'}`}
                        >
                          {u.banned ? <CheckCircleIcon className="h-4 w-4" /> : <ShieldExclamationIcon className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => update(u.id, { is_admin: u.is_admin ? 0 : 1 })}
                          title={u.is_admin ? 'Retirer admin' : 'Rendre admin'}
                          className="p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                        >
                          <ShieldCheckIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirm({ action: 'delete', userId: u.id, userName: u.name })}
                          title="Supprimer"
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} total={total} limit={20} onPage={setPage} />

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Confirmer la suppression</h3>
            <p className="text-gray-600 text-sm mb-6">
              Supprimer <strong>{confirm.userName}</strong> ? Cette action est irréversible et supprimera toutes ses annonces et réservations.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={() => deleteUser(confirm.userId)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CARS TAB ─────────────────────────────────────────────────────────────────

function CarsTab() {
  const [cars, setCars] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [availableFilter, setAvailableFilter] = useState('');
  const [confirm, setConfirm] = useState(null);

  const fetchCars = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (search) params.search = search;
    if (typeFilter) params.type = typeFilter;
    if (availableFilter !== '') params.available = availableFilter;
    axios.get('/api/admin/cars', { params })
      .then(r => { setCars(r.data.cars); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, typeFilter, availableFilter]);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const toggleAvailable = async (car) => {
    await axios.put(`/api/admin/cars/${car.id}`, { available: car.available ? 0 : 1 });
    fetchCars();
  };

  const deleteCar = async (carId) => {
    await axios.delete(`/api/admin/cars/${carId}`);
    setConfirm(null);
    fetchCars();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Titre, marque, ville..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-9 py-2 text-sm w-full"
          />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="input-field py-2 text-sm">
          <option value="">Tous types</option>
          {['sedan','suv','van','sports','luxury','economy'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={availableFilter} onChange={e => { setAvailableFilter(e.target.value); setPage(1); }} className="input-field py-2 text-sm">
          <option value="">Toutes</option>
          <option value="1">Disponibles</option>
          <option value="0">Désactivées</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Annonce</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Propriétaire</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Prix/j</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Résa</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chargement...</td></tr>
              ) : cars.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucune annonce</td></tr>
              ) : cars.map(car => (
                <tr key={car.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {car.images?.[0] ? (
                        <img src={`/uploads/${car.images[0]}`} alt={car.title} className="h-10 w-14 object-cover rounded-lg flex-shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div className="h-10 w-14 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-300 text-lg">🚗</div>
                      )}
                      <div className="min-w-0">
                        <Link to={`/cars/${car.id}`} className="font-medium text-gray-900 hover:text-primary-700 truncate block">
                          {car.title}
                        </Link>
                        <p className="text-xs text-gray-400">{car.brand} {car.model} · {car.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{car.owner_name}</p>
                    <p className="text-xs text-gray-400">{car.owner_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{car.type}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{car.price_per_day?.toLocaleString()} GNF</td>
                  <td className="px-4 py-3 text-center text-gray-600">{car.booking_count}</td>
                  <td className="px-4 py-3 text-center">
                    {car.available ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Disponible</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">Désactivée</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => toggleAvailable(car)}
                        title={car.available ? 'Désactiver' : 'Activer'}
                        className={`p-1.5 rounded-lg transition-colors ${car.available ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {car.available ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setConfirm({ carId: car.id, carTitle: car.title })}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} total={total} limit={20} onPage={setPage} />

      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Supprimer l'annonce</h3>
            <p className="text-gray-600 text-sm mb-6">
              Supprimer <strong>{confirm.carTitle}</strong> ? Les réservations associées seront également supprimées.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={() => deleteCar(confirm.carId)} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BOOKINGS TAB ─────────────────────────────────────────────────────────────

function BookingsTab() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionModal, setActionModal] = useState(null); // { bookingId, currentStatus }

  const fetchBookings = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    axios.get('/api/admin/bookings', { params })
      .then(r => { setBookings(r.data.bookings); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const forceStatus = async (bookingId, status) => {
    await axios.put(`/api/admin/bookings/${bookingId}`, { status });
    setActionModal(null);
    fetchBookings();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="input-field py-2 text-sm">
          <option value="">Tous statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmées</option>
          <option value="rejected">Refusées</option>
          <option value="cancelled">Annulées</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Voiture</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Locataire</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Propriétaire</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Dates</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Montant</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Chargement...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Aucune réservation</td></tr>
              ) : bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.car_title}</p>
                    <p className="text-xs text-gray-400">{b.brand} {b.model}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{b.renter_name}</p>
                    <p className="text-xs text-gray-400">{b.renter_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{b.owner_name}</p>
                    <p className="text-xs text-gray-400">{b.owner_email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {b.start_date} → {b.end_date}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">{b.total_price?.toLocaleString()} GNF</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status]}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setActionModal({ bookingId: b.id, currentStatus: b.status })}
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium px-2 py-1 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} total={total} limit={20} onPage={setPage} />

      {/* Force status modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Modifier le statut</h3>
            <p className="text-gray-500 text-sm mb-4">Statut actuel : <strong>{actionModal.currentStatus}</strong></p>
            <div className="space-y-2">
              {['pending', 'confirmed', 'rejected', 'cancelled'].filter(s => s !== actionModal.currentStatus).map(s => (
                <button
                  key={s}
                  onClick={() => forceStatus(actionModal.bookingId, s)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${STATUS_COLORS[s]} hover:opacity-80`}
                >
                  {s === 'confirmed' ? 'Confirmer' : s === 'rejected' ? 'Refuser' : s === 'cancelled' ? 'Annuler' : 'Remettre en attente'}
                </button>
              ))}
            </div>
            <button onClick={() => setActionModal(null)} className="btn-secondary w-full mt-4">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  if (!user?.is_admin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <ShieldExclamationIcon className="h-16 w-16 text-red-400" />
        <h1 className="text-2xl font-bold text-gray-900">Accès refusé</h1>
        <p className="text-gray-500">Cette page est réservée aux administrateurs.</p>
        <Link to="/" className="btn-primary mt-2">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheckIcon className="h-8 w-8 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel Admin</h1>
          <p className="text-sm text-gray-500">Gestion de la plateforme GuiCarLoc</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'stats' && <StatsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'cars' && <CarsTab />}
      {activeTab === 'bookings' && <BookingsTab />}
    </div>
  );
}
