import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="bg-luxuryBlack min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/" className="text-gnYellow text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">← Retour</Link>
        <h1 className="text-4xl font-display font-black text-white mt-8 mb-2 uppercase tracking-tighter">Politique de Confidentialité</h1>
        <p className="text-gray-500 text-sm mb-12">Dernière mise à jour : mai 2026</p>

        <div className="space-y-10 text-gray-400 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">1. Qui sommes-nous ?</h2>
            <p>GuiCarLoc est une plateforme de location de véhicules entre particuliers opérant en République de Guinée, accessible sur <span className="text-white">www.guicarloc.com</span>. En utilisant notre service, vous acceptez les pratiques décrites dans cette politique.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">2. Données collectées</h2>
            <p className="mb-3">Nous collectons les données suivantes lors de votre utilisation de la plateforme :</p>
            <ul className="space-y-2 list-none">
              {[
                'Informations d\'identification : nom, prénom, adresse email, numéro de téléphone',
                'Données de compte : mot de passe (chiffré), photo de profil, pièce d\'identité (vérification)',
                'Annonces : informations sur les véhicules, photos, localisation (ville, quartier)',
                'Réservations : dates, montants, statuts',
                'Messages échangés entre utilisateurs',
                'Données de navigation : adresse IP, type de navigateur, pages visitées',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gnYellow mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">3. Utilisation des données</h2>
            <p className="mb-3">Vos données sont utilisées pour :</p>
            <ul className="space-y-2 list-none">
              {[
                'Créer et gérer votre compte utilisateur',
                'Permettre la mise en relation entre propriétaires et locataires',
                'Traiter les réservations et envoyer des notifications par email',
                'Vérifier l\'identité des utilisateurs pour la sécurité de la plateforme',
                'Améliorer nos services et l\'expérience utilisateur',
                'Respecter nos obligations légales',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gnYellow mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">4. Partage des données</h2>
            <p className="mb-3">Nous ne vendons jamais vos données. Vos informations peuvent être partagées uniquement avec :</p>
            <ul className="space-y-2 list-none">
              {[
                'Les autres utilisateurs dans le cadre normal d\'une réservation (nom, numéro de téléphone)',
                'Cloudinary : hébergement des photos (images de profil et de véhicules)',
                'Resend : envoi des emails transactionnels (confirmations, notifications)',
                'Les autorités légales si la loi l\'exige',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gnYellow mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">5. Conservation des données</h2>
            <p>Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données personnelles sont supprimées dans un délai de 30 jours, à l'exception des données nécessaires à nos obligations légales.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">6. Vos droits</h2>
            <p className="mb-3">Vous disposez des droits suivants concernant vos données :</p>
            <ul className="space-y-2 list-none">
              {[
                'Droit d\'accès : obtenir une copie de vos données',
                'Droit de rectification : corriger des données inexactes',
                'Droit à l\'effacement : demander la suppression de votre compte et de vos données',
                'Droit à la portabilité : recevoir vos données dans un format structuré',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gnYellow mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">Pour exercer ces droits, contactez-nous à <span className="text-white">contact@guicarloc.com</span>.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">7. Sécurité</h2>
            <p>Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données contre tout accès non autorisé, altération ou divulgation. Les mots de passe sont chiffrés et ne sont jamais stockés en clair.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">8. Contact</h2>
            <p>Pour toute question relative à cette politique de confidentialité :<br />
            Email : <span className="text-white">contact@guicarloc.com</span><br />
            Site : <span className="text-white">www.guicarloc.com</span></p>
          </section>

        </div>
      </div>
    </div>
  );
}
