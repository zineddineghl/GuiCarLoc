import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
              <span className="text-2xl">🚗</span>
              <span>RentCar</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
              {t('footer.description')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/listings" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.listings')}
                </Link>
              </li>
              <li>
                <Link to="/post-listing" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.post_listing')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Compte / Account</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.login')}
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.register')}
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.my_bookings')}
                </Link>
              </li>
              <li>
                <Link to="/my-listings" className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('nav.my_listings')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} RentCar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
