import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { PhotoIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
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
    weekend_price: '',
    min_rental_days: '',
    max_rental_days: '',
    requires_deposit: false,
    deposit_amount: '',
    // Remplacement des colonnes fixes par un tableau dynamique
    discounts: [] 
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
            // Parsing du JSON provenant de la DB
            discounts: car.discounts ? (typeof car.discounts === 'string' ? JSON.parse(car.discounts) : car.discounts) : []
          });
          setExistingImages(car.images || []);
        })
        .catch(() => setError('Car not found'))
        .finally(() => setFetchLoading(false));
    }
  }, [id, isEdit]);

  // --- Logique des Réductions Dynamiques ---
  const addDiscountRule = () => {
    setForm(prev => ({
      ...prev,
      discounts: [...prev.discounts, { days: '', percentage: '' }]
    }));
  };

  const removeDiscountRule = (index) => {
    setForm(prev => ({
      ...prev,
      discounts: prev.discounts.filter((_, i) => i !== index)
    }));
  };

  const handleDiscountChange = (index, field, value) => {
    const updatedDiscounts = [...form.discounts];
    updatedDiscounts[index][field] = value;
    setForm(prev => ({ ...prev, discounts: updatedDiscounts }));
  };

  // --- Handlers Classiques ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if ((existingImages.length + newImages.length + files.length) > 8) {
      setError('Maximum 8 photos');
      return;
    }

    try {
      const options = { maxWidthOrHeight: 1200, maxSizeMB: 1, useWebWorker: false };
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          const compressedBlob = await imageCompression(file, options);
          return new File([compressedBlob], file.name, { type: file.type });
        })
      );
      setNewImages(prev => [...prev, ...compressedFiles]);
      setPreviews(prev => [...prev, ...compressedFiles.map(f => URL.createObjectURL(f))]);
    } catch (err) {
      console.error(err);
    }
  };

  const removeExistingImage = (idx) => setExistingImages(prev => prev.filter((_, i) => i !== idx));
  const removeNewImage = (idx) => {
    setPreviews(prev => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx); });
    setNewImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.brand || !form.model || !form.price_per_day || !form.city) {
      setError(i18n.language.startsWith('fr') ? 'Champs obligatoires manquants' : 'Required fields missing');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'discounts') {
          formData.append(key, JSON.stringify(val)); // Envoi en JSON string
        } else {
          formData.append(key, val);
        }
      });

      if (isEdit) formData.append('existing_images', JSON.stringify(existingImages));
      newImages.forEach(img => formData.append('images', img));

      if (isEdit) {
        await axios.put(`/api/cars/${id}`, formData);
        setSuccess('Annonce mise à jour !');
        setTimeout(() => navigate('/my-listings'), 1500);
      } else {
        const res = await axios.post('/api/cars', formData);
        setSuccess('Annonce publiée !');
        setTimeout(() => navigate(`/cars/${res.data.car.id}`), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const Label = ({ children, required }) => (
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
      {children} {required && <span className="text-gnYellow">*</span>}
    </label>
  );

  if (fetchLoading) return <div className="min-h-screen flex items-center justify-center bg-luxuryBlack"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gnYellow"></div></div>;

  return (
    <div className="bg-luxuryBlack min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-display font-black text-white mb-8 uppercase tracking-tighter text-center">
          {isEdit ? t('listing.edit_title') : t('listing.title')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Informations générales */}
          <div className="card p-8 border border-white/5 bg-luxuryDark rounded-3xl">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6 pb-4 border-b border-white/5">
              {i18n.language.startsWith('fr') ? 'Informations générales' : 'General Information'}
            </h2>
            <div className="space-y-6">
              <div>
                <Label required>{t('listing.car_title')}</Label>
                <input type="text" name="title" value={form.title} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" required />
              </div>
              <div>
                <Label>{t('listing.description')}</Label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* Caractéristiques */}
          <div className="card p-8 border border-white/5 bg-luxuryDark rounded-3xl">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6 pb-4 border-b border-white/5">
              {i18n.language.startsWith('fr') ? 'Véhicule' : 'Vehicle'}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-8">
              {CAR_TYPES.map(type => (
                <button key={type} type="button" onClick={() => setForm(p => ({ ...p, type }))} className={`flex flex-col items-center p-3 rounded-xl border transition-all ${form.type === type ? 'bg-gnYellow/10 text-gnYellow border-gnYellow/50' : 'bg-white/5 text-gray-500 border-white/5'}`}>
                  <span className="text-xl mb-1">{type === 'sedan' ? '🚗' : type === 'suv' ? '🚙' : '🏎️'}</span>
                  <span className="text-[8px] font-bold uppercase">{t(`car.type_${type}`)}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div><Label required>{t('listing.brand')}</Label><input type="text" name="brand" value={form.brand} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" /></div>
              <div><Label required>{t('listing.model')}</Label><input type="text" name="model" value={form.model} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" /></div>
              <div><Label required>{t('listing.year')}</Label><input type="number" name="year" value={form.year} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" /></div>
              <div><Label required>{t('listing.seats')}</Label><input type="number" name="seats" value={form.seats} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" /></div>
            </div>
          </div>

          {/* Tarification & Réductions DYNAMIQUES */}
          <div className="card p-8 border border-white/5 bg-luxuryDark rounded-3xl">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6 pb-4 border-b border-white/5">
              {i18n.language.startsWith('fr') ? 'Tarifs & Réductions' : 'Pricing & Discounts'}
            </h2>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <Label required>{t('listing.price')} (Semaine)</Label>
                <div className="relative">
                  <input type="number" name="price_per_day" value={form.price_per_day} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">GNF/J</span>
                </div>
              </div>
              <div>
                <Label>Prix Week-end</Label>
                <div className="relative">
                  <input type="number" name="weekend_price" value={form.weekend_price} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">GNF/J</span>
                </div>
              </div>
            </div>

            {/* SECTION DYNAMIQUE DES RÉDUCTIONS */}
            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <Label>{i18n.language.startsWith('fr') ? 'Réductions par durée' : 'Duration Discounts'}</Label>
                <button type="button" onClick={addDiscountRule} className="text-[9px] font-black bg-gnYellow text-black px-3 py-1 rounded-full uppercase tracking-tighter hover:scale-105 transition-transform">
                  + Ajouter un palier
                </button>
              </div>
              
              <div className="space-y-3">
                {form.discounts.map((discount, index) => (
                  <div key={index} className="flex items-center gap-3 animate-fadeIn">
                    <div className="flex-1">
                      <input type="number" value={discount.days} onChange={(e) => handleDiscountChange(index, 'days', e.target.value)} placeholder="Nb jours" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" />
                    </div>
                    <div className="flex-1 relative">
                      <input type="number" value={discount.percentage} onChange={(e) => handleDiscountChange(index, 'percentage', e.target.value)} placeholder="Réduction" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gnYellow font-bold">%</span>
                    </div>
                    <button type="button" onClick={() => removeDiscountRule(index)} className="p-3 text-gnRed hover:bg-gnRed/10 rounded-xl transition-colors">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Caution */}
            <div className="mt-8 p-5 bg-white/5 rounded-2xl">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <input type="checkbox" name="requires_deposit" checked={form.requires_deposit} onChange={handleChange} className="w-5 h-5 accent-gnYellow" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">Exiger une caution</span>
              </label>
              {form.requires_deposit && (
                <input type="number" name="deposit_amount" value={form.deposit_amount} onChange={handleChange} placeholder="Montant de la caution (GNF)" className="w-full bg-black/40 border border-gnYellow/30 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow outline-none" />
              )}
            </div>
          </div>

          {/* Localisation */}
          <div className="card p-8 border border-white/5 bg-luxuryDark rounded-3xl">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-6 pb-4 border-b border-white/5">{t('listing.city')}</h2>
            <div className="grid grid-cols-2 gap-6">
              <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="Ville" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" required />
              <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Adresse (Optionnel)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-gnYellow/50 outline-none" />
            </div>
          </div>

          {/* Photos */}
          <div className="card p-8 border border-white/5 bg-luxuryDark rounded-3xl">
            <h2 className="text-gnYellow font-bold text-xs uppercase tracking-widest mb-4">{t('listing.images')}</h2>
            <div className="grid grid-cols-4 gap-4">
              {existingImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                  <img src={imgUrl(img)} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white"><XMarkIcon className="w-4 h-4" /></button>
                </div>
              ))}
              {previews.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gnYellow/50">
                  <img src={src} className="w-full h-full object-cover" alt="" />
                  <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white"><XMarkIcon className="w-4 h-4" /></button>
                </div>
              ))}
              {(existingImages.length + newImages.length) < 8 && (
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-gnYellow hover:bg-gnYellow/5 transition-all">
                  <PhotoIcon className="w-8 h-8 text-gray-500" />
                  <input type="file" multiple onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold uppercase text-xs tracking-widest hover:bg-white/5 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-xl bg-gnYellow text-black font-black uppercase text-sm tracking-widest hover:scale-[1.02] transition-transform shadow-lg shadow-gnYellow/20">
              {loading ? t('common.loading') : isEdit ? t('listing.update') : t('listing.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}