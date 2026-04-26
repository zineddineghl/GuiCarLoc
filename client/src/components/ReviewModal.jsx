import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

function StarPicker({ value, onChange, label }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
          >
            <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-300'}>
              ★
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewModal({ booking, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [carRating, setCarRating] = useState(0);
  const [ownerRating, setOwnerRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!carRating || !ownerRating) {
      setError(t('common.error'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post('/api/reviews', {
        booking_id: booking.id,
        car_rating: carRating,
        owner_rating: ownerRating,
        comment: comment.trim() || null
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{t('review.title')}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Car info */}
          <p className="text-sm text-gray-500">
            {booking.car_title || `${booking.brand} ${booking.model}`}
          </p>

          {/* Car rating */}
          <StarPicker
            value={carRating}
            onChange={setCarRating}
            label={t('review.car_rating')}
          />

          {/* Owner rating */}
          <StarPicker
            value={ownerRating}
            onChange={setOwnerRating}
            label={t('review.owner_rating')}
          />

          {/* Comment */}
          <div>
            <label className="text-sm font-medium text-gray-700">{t('review.comment')}</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={t('review.comment_placeholder')}
              rows={3}
              className="input-field mt-1 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !carRating || !ownerRating}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? t('common.loading') : t('review.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
