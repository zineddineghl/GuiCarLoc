import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="bg-luxuryBlack min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link to="/" className="text-gnYellow text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">← Retour</Link>
        <h1 className="text-4xl font-display font-black text-white mt-8 mb-2 uppercase tracking-tighter">Conditions d'Utilisation</h1>
        <p className="text-gray-500 text-sm mb-12">Dernière mise à jour : mai 2026</p>

        <div className="space-y-10 text-gray-400 text-sm leading-relaxed">

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">1. Présentation du service</h2>
            <p>GuiCarLoc est une plateforme de mise en relation entre propriétaires de véhicules et personnes souhaitant louer un véhicule en République de Guinée. GuiCarLoc agit en tant qu'intermédiaire et n'est pas propriétaire des véhicules listés sur la plateforme.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">2. Création de compte</h2>
            <p className="mb-3">Pour utiliser les fonctionnalités de la plateforme, vous devez créer un compte. En créant un compte, vous vous engagez à :</p>
            <ul className="space-y-2 list-none">
              {[
                'Fournir des informations exactes et complètes',
                'Maintenir la confidentialité de votre mot de passe',
                'Avoir au moins 18 ans',
                'N\'utiliser qu\'un seul compte par personne',
                'Notifier immédiatement GuiCarLoc de tout usage non autorisé',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gnYellow mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">3. Obligations des propriétaires</h2>
            <p className="mb-3">En publiant une annonce sur GuiCarLoc, le propriétaire s'engage à :</p>
            <ul className="space-y-2 list-none">
              {[
                'Être le propriétaire légal du véhicule ou avoir l\'autorisation de le louer',
                'Fournir des informations exactes sur le véhicule (état, caractéristiques, photos)',
                'Maintenir le véhicule en bon état de fonctionnement et conforme aux normes de sécurité',
                'Honorer les réservations confirmées',
                'Respecter les tarifs indiqués dans l\'annonce',
                'Déclarer toute modification importante de l\'état du véhicule',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gnYellow mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">4. Obligations des locataires</h2>
            <p className="mb-3">En effectuant une réservation, le locataire s'engage à :</p>
            <ul className="space-y-2 list-none">
              {[
                'Posséder un permis de conduire valide',
                'Utiliser le véhicule conformément au code de la route guinéen',
                'Restituer le véhicule dans l\'état dans lequel il a été reçu',
                'Restituer le véhicule à la date et heure convenues',
                'Signaler immédiatement tout accident ou dommage au propriétaire',
                'Ne pas sous-louer le véhicule à un tiers',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gnYellow mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">5. Réservations et paiements</h2>
            <p className="mb-3">GuiCarLoc est une plateforme de mise en relation. Les paiements sont effectués directement entre le propriétaire et le locataire. GuiCarLoc ne traite pas les paiements et n'est pas responsable des transactions financières entre utilisateurs.</p>
            <p>Toute caution convenue est à gérer directement entre les deux parties. Les tarifs affichés sont en Francs Guinéens (GNF).</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">6. Annulations</h2>
            <p>Les conditions d'annulation sont convenues entre les parties. Le locataire peut annuler une réservation en statut "en attente" depuis son espace personnel. Une réservation confirmée ne peut être annulée que par accord mutuel entre les deux parties.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">7. Responsabilité</h2>
            <p className="mb-3">GuiCarLoc agit en tant qu'intermédiaire technique et ne peut être tenu responsable :</p>
            <ul className="space-y-2 list-none">
              {[
                'Des dommages causés au véhicule durant la location',
                'Des accidents impliquant le véhicule loué',
                'Du comportement des utilisateurs de la plateforme',
                'Des informations inexactes fournies par les utilisateurs',
                'Des pertes financières résultant d\'une transaction entre utilisateurs',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gnYellow mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">8. Contenus interdits</h2>
            <p className="mb-3">Il est strictement interdit de :</p>
            <ul className="space-y-2 list-none">
              {[
                'Publier de fausses annonces ou des informations trompeuses',
                'Utiliser la plateforme à des fins illégales',
                'Harceler ou menacer d\'autres utilisateurs',
                'Tenter de contourner les systèmes de sécurité de la plateforme',
                'Créer plusieurs comptes pour contourner des sanctions',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gnYellow mt-1">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">GuiCarLoc se réserve le droit de suspendre ou supprimer tout compte ne respectant pas ces conditions.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">9. Modification des conditions</h2>
            <p>GuiCarLoc se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés par email des modifications importantes. L'utilisation continue de la plateforme après notification vaut acceptation des nouvelles conditions.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-xs uppercase tracking-widest mb-4 text-gnYellow">10. Contact</h2>
            <p>Pour toute question relative à ces conditions d'utilisation :<br />
            Email : <span className="text-white">noreply.guicarloc@gmail.com</span><br />
            Site : <span className="text-white">www.guicarloc.com</span></p>
          </section>

        </div>
      </div>
    </div>
  );
}
