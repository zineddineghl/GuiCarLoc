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
  const { t, i18n } = useTranslation();
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
    available: true,
    // Nouveaux champs Tarifs & Conditions :
    weekend_price: '',
    min_rental_days: '',
    max_rental_days: '',
    requires_deposit: false,
    deposit_amount: '',
    // Nouveaux champs de réductions (%) :
    discount_3_days: '',
    discount_7_days: ''
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
            available: Boolean(car.available),
            weekend_price: car.weekend_price || '',
            min_rental_days: car.min_rental_days || '',
            max_rental_days: car.max_rental_days || '',
            requires_deposit: Boolean(car.requires_deposit),
            deposit_amount: car.deposit_amount || '',
            // Chargement des réductions existantes
            discount_3_days: car.discount_3_days || '',
            discount_7_days: car.discount_7_days || ''
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
      setError(i18n.language.startsWith('fr') ? 'Maximum 8 photos' : 'Maximum 8 photos');
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
      setError(i18n.language.startsWith('fr') ? 'Veuillez remplir tous les champs obligatoires' : 'Please fill in all required fields');
      return;
    }

    if (form.requires_deposit && !form.deposit_amount) {
      setError(i18n.language.startsWith('fr') ? 'Veuillez indiquer le montant de la caution' : 'Please provide the deposit amount');
      return;
    }

    // Vérification des réductions pour éviter les erreurs de saisie
    if ((form.discount_3_days && form.discount_3_days > 100) || (form.discount_7_days && form.discount_7_days > 100)) {
      setError(i18n.language.startsWith('fr') ? 'La réduction ne peut pas dépasser 100%' : 'Discount cannot exceed 100%');
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
        setSuccess(i18n.language.startsWith('fr') ? 'Annonce mise à jour !' : 'Listing updated!');
        setTimeout(() => navigate('/my-listings'), 1500);
      } else {
        res = await axios.post('/api/cars', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess(i18n.language.startsWith('fr') ? 'Annonce publiée !' : 'Listing published!');
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
      <div className="min-h-[60vh] flex items-center justify-center bg-luxuryBlack">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gnYellow"></div>
      </div>
    );
  }

  const Label = ({ children, required }) => (
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
      {children} {required && <span className="text-gnYellow">*</span>}
    </label>
  );

  return (
    <div className="bg-luxuryBlack min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl md:text-4xl font-display font-black text-white mb-8 uppercase tracking-tighter text-center">
          {isEdit ? t('listing.edit_title') : t('listing.title')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* General Information */}
          <div className="card p-8 border border-white/5 bg-luxuryDark rounded-3xl">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6 pb-4 border-b border-white/5">
              {i18n.language.startsWith('fr') ? 'Informations générales' : 'General Information'}
            </h2>
            <div className="space-y-6">
              <div>
                <Label required>{t('listing.car_title')}</Label>
                <input type="text" name="title" value={form.title} onChange={handleChange} placeholder={t('listing.car_title_placeholder')} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none" required />
              </div>
              <div>
                <Label>{t('listing.description')}</Label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder={t('listing.description_placeholder')} rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 focus:ring-1 focus:ring-gnYellow/50 transition-all outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="card p-8 border border-white/5 bg-luxuryDark rounded-3xl">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6 pb-4 border-b border-white/5">
              {i18n.language.startsWith('fr') ? 'Caractéristiques du véhicule' : 'Vehicle Details'}
            </h2>
            <div className="space-y-8">
              {/* Type Grid */}
              <div>
                <Label required>{t('listing.type')}</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {CAR_TYPES.map(type => {
                    const icons = { sedan: '🚗', suv: '🚙', van: '🚐', sports: '🏎️', luxury: '🚘', economy: '🚕', scooter: '🛵', moto: '🏍️', boat: '⛵' };
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, type }))}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300 ${
                          form.type === type
                            ? 'bg-gnYellow/10 text-gnYellow border-gnYellow/50 shadow-[0_0_15px_rgba(252,209,22,0.15)] scale-105'
                            : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-2xl drop-shadow-md">{icons[type]}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t(`car.type_${type}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div><Label required>{t('listing.brand')}</Label><input type="text" name="brand" value={form.brand} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" /></div>
                <div><Label required>{t('listing.model')}</Label><input type="text" name="model" value={form.model} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" /></div>
                <div><Label required>{t('listing.year')}</Label><input type="number" name="year" value={form.year} onChange={handleChange} min="1990" max={CURRENT_YEAR + 1} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" /></div>
                <div><Label required>{t('listing.seats')}</Label><input type="number" name="seats" value={form.seats} onChange={handleChange} min="1" max="9" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" /></div>
                <div>
                  <Label required>{t('listing.transmission')}</Label>
                  <select name="transmission" value={form.transmission} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none appearance-none">
                    {TRANSMISSIONS.map(t_ => <option key={t_} value={t_} className="bg-luxuryBlack">{t(`car.transmission_${t_}`)}</option>)}
                  </select>
                </div>
                <div>
                  <Label required>{t('listing.fuel')}</Label>
                  <select name="fuel" value={form.fuel} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none appearance-none">
                    {FUELS.map(f => <option key={f} value={f} className="bg-luxuryBlack">{t(`car.fuel_${f}`)}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Tarification Avancée & Conditions */}
          <div className="card p-8 border border-white/5 bg-luxuryDark rounded-3xl">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6 pb-4 border-b border-white/5">
              {i18n.language.startsWith('fr') ? 'Tarification & Conditions' : 'Pricing & Conditions'}
            </h2>

            <div className="space-y-8">
              {/* Tarifs de base */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label required>{t('listing.price')} ({i18n.language.startsWith('fr') ? 'Semaine' : 'Weekday'})</Label>
                  <div className="relative">
                    <input type="number" name="price_per_day" value={form.price_per_day} onChange={handleChange} min="1" step="0.01" placeholder="Ex: 500000" required className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-16 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs uppercase tracking-widest">GNF/J</span>
                  </div>
                </div>
                <div>
                  <Label>{i18n.language.startsWith('fr') ? 'Prix Week-end' : 'Weekend Price'} <span className="text-gray-600 font-normal ml-1 lowercase italic">({t('common.optional')})</span></Label>
                  <div className="relative">
                    <input type="number" name="weekend_price" value={form.weekend_price} onChange={handleChange} min="1" step="0.01" placeholder="Ex: 600000" className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-16 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs uppercase tracking-widest">GNF/J</span>
                  </div>
                </div>
              </div>

              {/* Réductions de durée */}
              <div className="pt-6 border-t border-white/5">
                <h3 className="text-white font-bold text-sm mb-4">
                  {i18n.language.startsWith('fr') ? 'Réductions par durée (%)' : 'Duration Discounts (%)'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label>{i18n.language.startsWith('fr') ? 'Dès 3 jours de location' : '3+ days discount'} <span className="text-gray-600 font-normal ml-1 lowercase italic">({t('common.optional')})</span></Label>
                    <div className="relative">
                      <input type="number" name="discount_3_days" value={form.discount_3_days} onChange={handleChange} min="0" max="100" placeholder="Ex: 10" className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gnYellow font-bold text-xs uppercase">%</span>
                    </div>
                  </div>
                  <div>
                    <Label>{i18n.language.startsWith('fr') ? 'Dès 7 jours de location' : '7+ days discount'} <span className="text-gray-600 font-normal ml-1 lowercase italic">({t('common.optional')})</span></Label>
                    <div className="relative">
                      <input type="number" name="discount_7_days" value={form.discount_7_days} onChange={handleChange} min="0" max="100" placeholder="Ex: 20" className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gnYellow font-bold text-xs uppercase">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Durées de location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                <div>
                  <Label>{i18n.language.startsWith('fr') ? 'Durée Minimum' : 'Min Duration'} <span className="text-gray-600 font-normal ml-1 lowercase italic">({t('common.optional')})</span></Label>
                  <div className="relative">
                    <input type="number" name="min_rental_days" value={form.min_rental_days} onChange={handleChange} min="1" placeholder="Ex: 2" className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-16 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[10px] uppercase tracking-widest">{i18n.language.startsWith('fr') ? 'Jours' : 'Days'}</span>
                  </div>
                </div>
                <div>
                  <Label>{i18n.language.startsWith('fr') ? 'Durée Maximum' : 'Max Duration'} <span className="text-gray-600 font-normal ml-1 lowercase italic">({t('common.optional')})</span></Label>
                  <div className="relative">
                    <input type="number" name="max_rental_days" value={form.max_rental_days} onChange={handleChange} min="1" placeholder="Ex: 30" className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-16 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[10px] uppercase tracking-widest">{i18n.language.startsWith('fr') ? 'Jours' : 'Days'}</span>
                  </div>
                </div>
              </div>

              {/* Caution */}
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl">
                <label className="flex items-center gap-3 cursor-pointer w-max mb-4">
                  <div className="relative flex items-center justify-center w-6 h-6 border-2 border-gray-400 rounded-md bg-transparent">
                    <input type="checkbox" name="requires_deposit" checked={form.requires_deposit} onChange={handleChange} className="appearance-none absolute inset-0 cursor-pointer checked:bg-gnYellow checked:border-gnYellow transition-colors rounded-md" />
                    {form.requires_deposit && <XMarkIcon className="w-4 h-4 text-black absolute pointer-events-none stroke-[4px]" style={{ clipPath: 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)' }}/>}
                  </div>
                  <span className="text-sm font-bold text-white uppercase tracking-widest">
                    {i18n.language.startsWith('fr') ? 'Exiger une caution' : 'Require Deposit'}
                  </span>
                </label>
                
                {form.requires_deposit && (
                  <div className="pt-2 animate-fadeIn">
                    <Label required>{i18n.language.startsWith('fr') ? 'Montant de la caution' : 'Deposit Amount'}</Label>
                    <div className="relative max-w-sm">
                      <input type="number" name="deposit_amount" value={form.deposit_amount} onChange={handleChange} min="1" step="0.01" placeholder="Ex: 1000000" className="w-full bg-black/40 border border-gnYellow/30 rounded-xl pl-4 pr-16 py-3 text-white text-sm focus:border-gnYellow focus:ring-1 focus:ring-gnYellow outline-none transition-colors" required={form.requires_deposit} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gnYellow font-bold text-xs uppercase tracking-widest">GNF</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location & Disponibilité */}
          <div className="card p-8 border border-white/5 bg-luxuryDark rounded-3xl">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6 pb-4 border-b border-white/5">
              {i18n.language.startsWith('fr') ? 'Localisation & Disponibilité' : 'Location & Availability'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <Label required>{t('listing.city')}</Label>
                <input type="text" name="city" value={form.city} onChange={handleChange} placeholder={t('listing.city_placeholder')} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" />
              </div>
              <div>
                <Label>{t('listing.address')} <span className="text-gray-600 font-normal ml-1 lowercase italic">({t('common.optional')})</span></Label>
                <input type="text" name="address" value={form.address} onChange={handleChange} placeholder={t('listing.address_placeholder')} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none transition-colors" />
              </div>
            </div>

            {isEdit && (
              <label className="flex items-center gap-3 cursor-pointer mt-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors w-max">
                <div className="relative flex items-center justify-center w-6 h-6 border-2 border-gray-400 rounded-md bg-transparent">
                  <input type="checkbox" name="available" checked={form.available} onChange={handleChange} className="appearance-none absolute inset-0 cursor-pointer checked:bg-gnYellow checked:border-gnYellow transition-colors rounded-md" />
                  {form.available && <XMarkIcon className="w-4 h-4 text-black absolute pointer-events-none stroke-[4px]" style={{ clipPath: 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)' }}/>}
                </div>
                <span className="text-sm font-bold text-white uppercase tracking-widest">{t('listing.available')}</span>
              </label>
            )}
          </div>

          {/* Photos */}
          <div className="card p-8 border border-white/5 bg-luxuryDark rounded-3xl">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-2">
              {t('listing.images')}
            </h2>
            <p className="text-xs text-gray-500 font-medium mb-6 pb-4 border-b border-white/5">{t('listing.images_help')}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {existingImages.map((img, idx) => (
                <div key={`ext-${idx}`} className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black">
                  <img src={imgUrl(img)} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-gnRed hover:scale-110 transition-all border border-white/20">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {previews.map((src, idx) => (
                <div key={`prev-${idx}`} className="group relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-gnYellow/50 bg-black">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-gnRed hover:scale-110 transition-all border border-white/20">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(existingImages.length + newImages.length) < 8 && (
                <label className="flex flex-col items-center justify-center gap-3 aspect-[4/3] border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-gnYellow hover:bg-gnYellow/5 transition-colors bg-white/5 group">
                  <PhotoIcon className="h-8 w-8 text-gray-500 group-hover:text-gnYellow transition-colors" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center px-2 group-hover:text-gnYellow transition-colors">
                    {i18n.language.startsWith('fr') ? 'Ajouter' : 'Add Photo'}
                  </span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Feedback */}
          {error && <div className="p-4 bg-gnRed/10 border border-gnRed/20 text-gnRed rounded-xl text-sm font-bold">{error}</div>}
          {success && <div className="p-4 bg-gnGreen/10 border border-gnGreen/20 text-gnGreen rounded-xl text-sm font-bold">{success}</div>}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
            <button type="button" onClick={() => navigate(-1)} className="w-full sm:w-1/3 py-4 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={loading} className="w-full sm:w-2/3 py-4 rounded-xl bg-gradient-to-r from-gnYellow to-[#D4AF37] text-black font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-[0_10px_20px_rgba(252,209,22,0.2)] disabled:opacity-50 disabled:hover:scale-100">
              {loading ? t('common.loading') : isEdit ? t('listing.update') : t('listing.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}