import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../App';
import LanguageSwitcher from './LanguageSwitcher';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

function CarSvgIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V8a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2h-2M8 16v2m8-2v2M3 10h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10l2-4h6l2 4" />
    </svg>
  );
}

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout, notifCount, msgCount } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/');
  };

  // Nouveaux styles pour les liens (Mode Sombre)
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'bg-gnYellow/10 text-gnYellow border border-gnYellow/20'
        : 'text-gray-300 hover:text-white hover:bg-white/5'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-300 ${
      isActive
        ? 'bg-gnYellow/10 text-gnYellow border border-gnYellow/20'
        : 'text-gray-300 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="sticky top-0 z-50">
      {/* Guinea flag tricolor bar (Conservée car elle est parfaite !) */}
      <div className="h-1.5 flex">
        <div className="flex-1 bg-gnRed" />
        <div className="flex-1 bg-gnYellow" />
        <div className="flex-1 bg-gnGreen" />
      </div>
      
      {/* Fond de la Navbar en mode sombre */}
      <nav className="bg-luxuryBlack border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20"> {/* Hauteur légèrement augmentée pour faire plus aéré */}
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-gnYellow font-display font-bold text-2xl hover:opacity-80 transition-opacity tracking-wide">
              <span className="text-3xl">🚗</span>
              <span>GuiCarLoc</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/" end className={navLinkClass}>
                {t('nav.home')}
              </NavLink>
              <NavLink to="/listings" className={navLinkClass}>
                {t('nav.listings')}
              </NavLink>

              {user && (
                <>
                  <NavLink to="/post-listing" className={navLinkClass}>
                    {t('nav.post_listing')}
                  </NavLink>
                  <NavLink to="/my-listings" className={navLinkClass}>
                    {t('nav.my_listings')}
                  </NavLink>
                  <NavLink to="/my-bookings" className={navLinkClass}>
                    <span className="relative">
                      {t('nav.my_bookings')}
                      {notifCount > 0 && (
                        <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] bg-gnRed text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                          {notifCount > 99 ? '99+' : notifCount}
                        </span>
                      )}
                    </span>
                  </NavLink>
                  <NavLink to="/messages" className={navLinkClass}>
                    <span className="relative flex items-center gap-1.5">
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      {t('nav.messages')}
                      {msgCount > 0 && (
                        <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] bg-gnYellow text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                          {msgCount > 99 ? '99+' : msgCount}
                        </span>
                      )}
                    </span>
                  </NavLink>
                  <NavLink to="/favorites" className={navLinkClass}>
                    <HeartIcon className="h-4 w-4" />
                    {t('nav.favorites')}
                  </NavLink>
                  {(user.role === 'owner' || user.role === 'both') && (
                    <NavLink to="/dashboard" className={navLinkClass}>
                      <ChartBarIcon className="h-4 w-4" />
                      {t('nav.dashboard')}
                    </NavLink>
                  )}
                  {user.is_admin === 1 && (
                    <NavLink to="/admin" className={navLinkClass}>
                      <ShieldCheckIcon className="h-4 w-4" />
                      Admin
                    </NavLink>
                  )}
                </>
              )}
            </div>

            {/* Desktop Auth + Language */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />

              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={`/profile/${user.id}`}
                    className="text-sm text-gray-300 font-medium hover:text-gnYellow transition-colors"
                  >
                    {user.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-300 hover:text-gnRed hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <NavLink to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    {t('nav.login')}
                  </NavLink>
                  <NavLink to="/register" className="btn-primary btn-sm">
                    {t('nav.register')}
                  </NavLink>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-2 bg-luxuryBlack">
              <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                {t('nav.home')}
              </NavLink>
              <NavLink to="/listings" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                {t('nav.listings')}
              </NavLink>

              {user ? (
                <>
                  <NavLink to="/post-listing" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                    {t('nav.post_listing')}
                  </NavLink>
                  <NavLink to="/my-listings" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                    {t('nav.my_listings')}
                  </NavLink>
                  <NavLink to="/my-bookings" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                    <span className="flex items-center gap-2">
                      {t('nav.my_bookings')}
                      {notifCount > 0 && (
                        <span className="min-w-[20px] h-5 bg-gnRed text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                          {notifCount > 99 ? '99+' : notifCount}
                        </span>
                      )}
                    </span>
                  </NavLink>
                  <NavLink to="/messages" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                    <span className="flex items-center gap-2">
                      <ChatBubbleLeftRightIcon className="h-5 w-5" />
                      {t('nav.messages')}
                      {msgCount > 0 && (
                        <span className="min-w-[20px] h-5 bg-gnYellow text-black text-xs font-bold rounded-full flex items-center justify-center px-1">
                          {msgCount > 99 ? '99+' : msgCount}
                        </span>
                      )}
                    </span>
                  </NavLink>
                  <NavLink to="/favorites" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                    <HeartIcon className="h-5 w-5" />
                    {t('nav.favorites')}
                  </NavLink>
                  {(user.role === 'owner' || user.role === 'both') && (
                    <NavLink to="/dashboard" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                      <ChartBarIcon className="h-5 w-5" />
                      {t('nav.dashboard')}
                    </NavLink>
                  )}
                  {user.is_admin === 1 && (
                    <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                      <ShieldCheckIcon className="h-5 w-5" />
                      Admin
                    </NavLink>
                  )}
                  <div className="px-4 py-3 border-t border-white/10 mt-2">
                    <p className="text-sm text-gray-400 mb-3">{user.name}</p>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-sm font-medium text-gnRed hover:text-red-400 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 py-4 border-t border-white/10 mt-2 flex flex-col gap-3">
                  <NavLink to="/login" className="btn-secondary w-full text-center" onClick={() => setMobileOpen(false)}>
                    {t('nav.login')}
                  </NavLink>
                  <NavLink to="/register" className="btn-primary w-full text-center" onClick={() => setMobileOpen(false)}>
                    {t('nav.register')}
                  </NavLink>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}