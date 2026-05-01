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

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <div className="sticky top-0 z-50">
      {/* Guinea flag tricolor bar */}
      <div className="h-1 flex">
        <div className="flex-1 bg-[#CE1126]" />
        <div className="flex-1 bg-[#FCD116]" />
        <div className="flex-1 bg-[#009460]" />
      </div>
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-xl hover:opacity-80 transition-opacity">
            <span className="text-2xl">🚗</span>
            <span>GuiCarLoc</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
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
                      <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
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
                      <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
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
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={`/profile/${user.id}`}
                  className="text-sm text-gray-600 font-medium hover:text-primary-700 transition-colors"
                >
                  {user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  {t('nav.login')}
                </NavLink>
                <NavLink to="/register" className="btn-primary btn-sm">
                  {t('nav.register')}
                </NavLink>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
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
                      <span className="min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
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
                      <span className="min-w-[20px] h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
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
                <div className="px-4 py-2 border-t border-gray-100 mt-2 pt-3">
                  <p className="text-sm text-gray-500 mb-2">{user.name}</p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-2 border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2">
                <NavLink to="/login" className="btn-secondary btn-sm w-full text-center" onClick={() => setMobileOpen(false)}>
                  {t('nav.login')}
                </NavLink>
                <NavLink to="/register" className="btn-primary btn-sm w-full text-center" onClick={() => setMobileOpen(false)}>
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
