import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { imgUrl } from '../utils/imageUrl';
import imageCompression from 'browser-image-compression';

const CAR_TYPES = ['sedan', 'suv', 'van', 'sports', 'luxury', 'economy', 'scooter', 'moto', 'boat'];
const TRANSMISSIONS = ['auto', 'manual'];
const FUELS = ['petrol', 'diesel', 'electric', 'hybrid'];
const CURRENT_YEAR = new Date().getFullYear();

export default function PostListing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'sedan',
    brand: '',
    model: '',
    year: CURRENT_YEAR,
    seats: 5,
    transmission: 'auto',
    fuel: 'petrol',
    price_per_day: '',
    city: '',
    address: '',
    available: true
  });
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      axios.get(`/api/cars/${id}`)
        .then(res => {
          const car = res.data.car;
          setForm({
            title: car.title || '',
            description: car.description || '',
            type: car.type || 'sedan',
            brand: car.brand || '',
            model: car.model || '',
            year: car.year || CURRENT_YEAR,
            seats: car.seats || 5,
            transmission: car.transmission || 'auto',
            fuel: car.fuel || 'petrol',
            price_per_day: car.price_per_day || '',
            city: car.city || '',
            address: car.address || '',
            available: Boolean(car.available)
          });
          setExistingImages(car.images || []);
        })
        .catch(() => {
          setError('Car not found');
        })
        .finally(() => setFetchLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + newImages.length + files.length;

    if (totalImages > 8) {
      setError(t('i18n.language') === 'fr' ? 'Maximum 8 photos' : 'Maximum 8 photos');
      return;
    }

    const options = {
      maxWidthOrHeight: 1200,
      maxSizeMB: 1,
      useWebWorker: false
    };

    try {
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          const compressedBlob = await imageCompression(file, options);
          const ext = file.name.split('.').pop() || 'jpg';
          const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.' + ext;
          return new File([compressedBlob], newFileName, {
            type: compressedBlob.type || file.type,
            lastModified: Date.now(),
          });
        })
      );

      setNewImages(prev => [...prev, ...compressedFiles]);
      const newPreviews = compressedFiles.map(f => URL.createObjectURL(f));
      setPreviews(prev => [...prev, ...newPreviews]);

    } catch (err) {
      console.error('Compression error:', err);
      // Fallback : utiliser les fichiers originaux sans compression
      setNewImages(prev => [...prev, ...files]);
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
};

  const removeExistingImage = (idx) => {
    setExistingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNewImage = (idx) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
    setNewImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.brand || !form.model || !form.price_per_day || !form.city) {
      setError(t('i18n.language') === 'fr' ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        formData.append(key, val);
      });

      if (isEdit) {
        formData.append('existing_images', JSON.stringify(existingImages));
      }

      newImages.forEach(img => formData.append('images', img));

      let res;
      if (isEdit) {
        res = await axios.put(`/api/cars/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess(t('i18n.language') === 'fr' ? 'Annonce mise à jour !' : 'Listing updated!');
        setTimeout(() => navigate('/my-listings'), 1500);
      } else {
        res = await axios.post('/api/cars', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess(t('i18n.language') === 'fr' ? 'Annonce publiée !' : 'Listing published!');
        setTimeout(() => navigate(`/cars/${res.data.car.id}`), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isEdit ? t('listing.edit_title') : t('listing.title')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
            {t('i18n.language') === 'fr' ? 'Informations générales' : 'General Information'}
          </h2>

          <div className="form-group">
            <label className="form-label">{t('listing.car_title')} *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder={t('listing.car_title_placeholder')}
              className="input-field"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('listing.description')}</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={t('listing.description_placeholder')}
              rows={4}
              className="input-field resize-none"
            />
          </div>
        </div>

        {/* Car Details */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
            {t('i18n.language') === 'fr' ? 'Caractéristiques du véhicule' : 'Vehicle Details'}
          </h2>

          {/* Type */}
          <div className="form-group">
            <label className="form-label">{t('listing.type')} *</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CAR_TYPES.map(type => {
                const icons = { sedan: '🚗', suv: '🚙', van: '🚐', sports: '🏎️', luxury: '🚘', economy: '🚕', scooter: '🛵', moto: '🏍️', boat: '⛵' };
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, type }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      form.type === type
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{icons[type]}</span>
                    <span className="text-xs font-medium text-gray-700">{t(`car.type_${type}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">{t('listing.brand')} *</label>
              <input
                type="text"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder={t('listing.brand_placeholder')}
                className="input-field"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('listing.model')} *</label>
              <input
                type="text"
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder={t('listing.model_placeholder')}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Year & Seats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">{t('listing.year')} *</label>
              <input
                type="number"
                name="year"
                value={form.year}
                onChange={handleChange}
                min="1990"
                max={CURRENT_YEAR + 1}
                className="input-field"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('listing.seats')} *</label>
              <input
                type="number"
                name="seats"
                value={form.seats}
                onChange={handleChange}
                min="1"
                max="9"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Transmission & Fuel */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">{t('listing.transmission')} *</label>
              <select name="transmission" value={form.transmission} onChange={handleChange} className="input-field">
                {TRANSMISSIONS.map(t_ => (
                  <option key={t_} value={t_}>{t(`car.transmission_${t_}`)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('listing.fuel')} *</label>
              <select name="fuel" value={form.fuel} onChange={handleChange} className="input-field">
                {FUELS.map(f => (
                  <option key={f} value={f}>{t(`car.fuel_${f}`)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location & Price */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
            {t('i18n.language') === 'fr' ? 'Localisation & Tarif' : 'Location & Pricing'}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">{t('listing.city')} *</label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder={t('listing.city_placeholder')}
                className="input-field"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('listing.price')} *</label>
              <input
                type="number"
                name="price_per_day"
                value={form.price_per_day}
                onChange={handleChange}
                min="1"
                step="0.01"
                placeholder="50"
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('listing.address')} <span className="text-gray-400 font-normal">({t('common.optional')})</span>
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder={t('listing.address_placeholder')}
              className="input-field"
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="available"
                checked={form.available}
                onChange={handleChange}
                className="w-4 h-4 accent-primary-600"
              />
              <span className="text-sm font-medium text-gray-700">{t('listing.available')}</span>
            </label>
          )}
        </div>

        {/* Photos */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wider">
            {t('listing.images')}
          </h2>
          <p className="text-sm text-gray-500">{t('listing.images_help')}</p>

          {/* Existing images (edit mode) */}
          {existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img, idx) => (
                <div key={idx} className="relative w-24 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New image previews */}
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {previews.map((src, idx) => (
                <div key={idx} className="relative w-24 h-20 rounded-lg overflow-hidden border border-primary-200">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          {(existingImages.length + newImages.length) < 8 && (
            <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-500 font-medium">
                {t('i18n.language') === 'fr' ? 'Cliquez pour ajouter des photos' : 'Click to add photos'}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Error / Success */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4">
            {success}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary flex-1"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                {t('common.loading')}
              </span>
            ) : (
              isEdit ? t('listing.update') : t('listing.submit')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
