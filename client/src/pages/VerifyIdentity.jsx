import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../App';
import {
  ShieldCheckIcon,
  ClockIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

function UploadZone({ label, hint, file, onChange }) {
  const ref = useRef();
  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div className="flex flex-col gap-2">
      <p className="form-label">{label}</p>
      <div
        onClick={() => ref.current.click()}
        className="relative cursor-pointer border-2 border-dashed border-white/10 rounded-xl overflow-hidden hover:border-gnYellow/50 transition-colors bg-white/5 flex flex-col items-center justify-center min-h-[160px]"
      >
        {preview ? (
          <img src={preview} alt={label} className="w-full h-48 object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 px-4 text-center">
            <ArrowUpTrayIcon className="h-8 w-8 text-gray-500" />
            <p className="text-sm text-gray-400">{hint}</p>
            <p className="text-xs text-gray-600">JPG, PNG — max 10 Mo</p>
          </div>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => onChange(e.target.files[0] || null)}
        />
      </div>
      {file && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-gnRed hover:underline self-start"
        >
          Supprimer
        </button>
      )}
    </div>
  );
}

function StatusBanner({ status, reason }) {
  if (status === 'verified') return (
    <div className="flex items-center gap-3 p-4 bg-gnGreen/10 border border-gnGreen/30 rounded-xl">
      <ShieldCheckIcon className="h-6 w-6 text-gnGreen flex-shrink-0" />
      <div>
        <p className="font-bold text-gnGreen">Identite verifiee</p>
        <p className="text-sm text-gray-400">Vous pouvez effectuer des reservations sur GuiCarLoc.</p>
      </div>
    </div>
  );

  if (status === 'pending') return (
    <div className="flex items-center gap-3 p-4 bg-gnYellow/10 border border-gnYellow/30 rounded-xl">
      <ClockIcon className="h-6 w-6 text-gnYellow flex-shrink-0" />
      <div>
        <p className="font-bold text-gnYellow">Verification en cours</p>
        <p className="text-sm text-gray-400">Vos documents ont ete envoyes. Nous les examinons sous 24h.</p>
      </div>
    </div>
  );

  if (status === 'rejected') return (
    <div className="flex items-center gap-3 p-4 bg-gnRed/10 border border-gnRed/30 rounded-xl">
      <XCircleIcon className="h-6 w-6 text-gnRed flex-shrink-0" />
      <div>
        <p className="font-bold text-gnRed">Verification refusee</p>
        {reason && <p className="text-sm text-gray-400 mt-1">Motif : {reason}</p>}
        <p className="text-sm text-gray-400 mt-1">Veuillez soumettre de nouveau vos documents.</p>
      </div>
    </div>
  );

  return null;
}

export default function VerifyIdentity() {
  const { user, login, token } = useAuth();
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const idStatus = user?.id_status || 'none';

  const canSubmit = front && back && selfie;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('id_doc_front', front);
    formData.append('id_doc_back', back);
    formData.append('id_selfie', selfie);

    try {
      await axios.post('/api/users/me/verify-identity', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Rafraichir les infos user
      const meRes = await axios.get('/api/auth/me');
      login(token, meRes.data.user);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxuryBlack py-12">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <div className="section-label-tag mb-3">Securite du compte</div>
          <h1 className="text-3xl font-display font-bold text-white">Verification d'identite</h1>
          <div className="triline mt-3">
            <span className="t-red" />
            <span className="t-yellow" />
            <span className="t-green" />
          </div>
          <p className="text-gray-400 mt-2">
            Pour proteger les proprietaires et les locataires, nous verifions l'identite des utilisateurs avant toute reservation.
          </p>
        </div>

        {/* Status banner */}
        {(idStatus !== 'none' || success) && (
          <div className="mb-6">
            <StatusBanner
              status={success ? 'pending' : idStatus}
              reason={user?.id_rejection_reason}
            />
          </div>
        )}

        {/* Form — visible si none ou rejected */}
        {(idStatus === 'none' || idStatus === 'rejected') && !success && (
          <form onSubmit={handleSubmit} className="bg-luxuryDark rounded-2xl border border-white/5 p-6 flex flex-col gap-6">

            <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <ShieldCheckIcon className="h-5 w-5 text-gnYellow flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-400">
                Uploadez votre <strong className="text-white">CNI guinéenne</strong> (recto + verso) ainsi qu'un <strong className="text-white">selfie</strong> de vous tenant votre CNI. Vos documents sont stockes de façon securisee et ne sont utilises qu'a des fins de verification.
              </p>
            </div>

            <UploadZone
              label="CNI Recto"
              hint="Photo du recto de votre Carte Nationale d'Identite"
              file={front}
              onChange={setFront}
            />
            <UploadZone
              label="CNI Verso"
              hint="Photo du verso de votre Carte Nationale d'Identite"
              file={back}
              onChange={setBack}
            />
            <UploadZone
              label="Selfie avec votre CNI"
              hint="Prenez une photo de vous en tenant votre CNI visible"
              file={selfie}
              onChange={setSelfie}
            />

            {error && (
              <p className="text-gnRed text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="btn-primary w-full"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer mes documents'}
            </button>
          </form>
        )}

        {/* Ce qu'il faut savoir */}
        <div className="mt-8 bg-luxuryDark rounded-2xl border border-white/5 p-6">
          <h3 className="font-bold text-white mb-4">Ce qu'il faut savoir</h3>
          <ul className="space-y-3 text-sm text-gray-400">
            {[
              'La verification prend en general moins de 24h ouvrables.',
              'Vos documents sont stockes de façon securisee sur Cloudinary.',
              'Une fois verifie, vous pouvez effectuer des reservations illimitees.',
              'En cas de refus, vous pourrez soumettre de nouveaux documents.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircleIcon className="h-4 w-4 text-gnGreen flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-white transition-colors">
            Retour a l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
