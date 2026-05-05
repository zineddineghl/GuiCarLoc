import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-gray-400 mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-display font-black text-2xl mb-6 tracking-tighter">
              <span>Gui<span className="text-gnYellow">Car</span>Loc</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-sm italic">
              {t('footer.description') || "L'excellence de la location de véhicules entre particuliers en Guinée. Sécurité, luxe et simplicité à chaque trajet."}
            </p>
          </div>

          {/* Links Navigation */}
          <div>
            <h3 className="text-white font-bold mb-6 text-[10px] uppercase tracking-[0.3em] opacity-50">Navigation</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="hover:text-gnYellow text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-0 group-hover:w-2 h-px bg-gnYellow transition-all" />
                  {t('nav.home') || 'Accueil'}
                </Link>
              </li>
              <li>
                <Link to="/listings" className="hover:text-gnYellow text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-0 group-hover:w-2 h-px bg-gnYellow transition-all" />
                  {t('nav.listings') || 'Voir les voitures'}
                </Link>
              </li>
              <li>
                <Link to="/post-listing" className="hover:text-gnYellow text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-0 group-hover:w-2 h-px bg-gnYellow transition-all" />
                  {t('nav.post_listing') || 'Publier une annonce'}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-gnYellow text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-0 group-hover:w-2 h-px bg-gnYellow transition-all" />
                  Nous contacter
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-gnYellow text-sm transition-colors flex items-center gap-2 group">
                  <span className="w-0 group-hover:w-2 h-px bg-gnYellow transition-all" />
                  Nous connaître
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-bold mb-6 text-[10px] uppercase tracking-[0.3em] opacity-50">Compte / Account</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/login" className="hover:text-white text-sm transition-colors">{t('nav.login') || 'Connexion'}</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white text-sm transition-colors">{t('nav.register') || 'Inscription'}</Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-white text-sm transition-colors">{t('nav.my_bookings') || 'Mes réservations'}</Link>
              </li>
              <li>
                <Link to="/my-listings" className="hover:text-white text-sm transition-colors">{t('nav.my_listings') || 'Mes annonces'}</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">
            &copy; {currentYear} GuiCarLoc. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link to="/privacy" className="text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}