import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const CAR_TYPES = [
  { value: 'all', icon: '🚗', labelKey: 'car.type_all' },
  { value: 'sedan', icon: '🚗', labelKey: 'car.type_sedan' },
  { value: 'suv', icon: '🚙', labelKey: 'car.type_suv' },
  { value: 'van', icon: '🚐', labelKey: 'car.type_van' },
  { value: 'sports', icon: '🏎️', labelKey: 'car.type_sports' },
  { value: 'luxury', icon: '🚘', labelKey: 'car.type_luxury' },
  { value: 'economy', icon: '🚕', labelKey: 'car.type_economy' }
];

export default function SearchBar({ compact = false, initialValues = {} }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    type: initialValues.type || 'all',
    city: initialValues.city || '',
    start_date: initialValues.start_date || today,
    end_date: initialValues.end_date || tomorrow
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Ensure end_date is after start_date
      if (name === 'start_date' && value >= updated.end_date) {
        const nextDay = new Date(value);
        nextDay.setDate(nextDay.getDate() + 1);
        updated.end_date = nextDay.toISOString().split('T')[0];
      }
      return updated;
    });
  };

  const handleTypeSelect = (type) => {
    setForm(prev => ({ ...prev, type }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (form.type && form.type !== 'all') params.set('type', form.type);
    if (form.city) params.set('city', form.city);
    if (form.start_date) params.set('start_date', form.start_date);
    if (form.end_date) params.set('end_date', form.end_date);
    navigate(`/listings?${params.toString()}`);
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="form-label text-white">{t('home.search_type')}</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="input-field"
          >
            {CAR_TYPES.map(ct => (
              <option key={ct.value} value={ct.value}>
                {ct.icon} {t(ct.labelKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="form-label text-white">{t('home.search_city')}</label>
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder={t('home.search_city_placeholder')}
            className="input-field"
          />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="form-label text-white">{t('home.pickup_date')}</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            min={today}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <div className="flex-1 min-w-[130px]">
          <label className="form-label text-white">{t('home.return_date')}</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            min={form.start_date}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap">
          <MagnifyingGlassIcon className="h-4 w-4" />
          {t('home.search_button')}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Car Type Selector */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">
          {t('home.search_type')}
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {CAR_TYPES.map(ct => (
            <button
              key={ct.value}
              type="button"
              onClick={() => handleTypeSelect(ct.value)}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-center transition-all duration-200 ${
                form.type === ct.value
                  ? 'bg-white text-primary-700 shadow-lg scale-105'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <span className="text-2xl">{ct.icon}</span>
              <span className="text-xs font-medium leading-tight">{t(ct.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="form-label text-white/90">{t('home.search_city')}</label>
          <input
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder={t('home.search_city_placeholder')}
            className="input-field"
          />
        </div>
        <div>
          <label className="form-label text-white/90">{t('home.pickup_date')}</label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            min={today}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <div>
          <label className="form-label text-white/90">{t('home.return_date')}</label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            min={form.start_date}
            onChange={handleChange}
            className="input-field"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            {t('home.search_button')}
          </button>
        </div>
      </div>
    </form>
  );
}
