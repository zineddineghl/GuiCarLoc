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

  // Styles "Dark Luxury" pour les liens
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
      isActive
        ? 'bg-gnYellow/10 text-gnYellow border border-gnYellow/20 shadow-[0_0_15px_rgba(252,209,22,0.1)]'
        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
      isActive
        ? 'bg-gnYellow/10 text-gnYellow border border-gnYellow/20'
        : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="sticky top-0 z-50">
      {/* Guinea flag tricolor bar (Intouchable, elle est parfaite !) */}
      <div className="h-1.5 flex">
        <div className="flex-1 bg-gnRed" />
        <div className="flex-1 bg-gnYellow" />
        <div className="flex-1 bg-gnGreen" />
      </div>
      
      {/* Fond de la Navbar avec effet Glassmorphism Premium */}
      <nav className="bg-luxuryBlack/95 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo synchronisé avec le Footer */}
            <Link to="/" className="flex items-center gap-2 font-display font-black text-2xl hover:opacity-80 transition-opacity tracking-tighter">
              <span className="text-2xl drop-shadow-md">🚗</span>
              <span className="text-white">Gui<span className="text-gnYellow">Car</span>Loc</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1.5">
              <NavLink to="/" end className={navLinkClass}>{t('nav.home')}</NavLink>
              <NavLink to="/listings" className={navLinkClass}>{t('nav.listings')}</NavLink>

              {user && (
                <>
                  <NavLink to="/post-listing" className={navLinkClass}>{t('nav.post_listing')}</NavLink>
                  <NavLink to="/my-listings" className={navLinkClass}>{t('nav.my_listings')}</NavLink>
                  <NavLink to="/my-bookings" className={navLinkClass}>
                    <span className="relative flex items-center">
                      {t('nav.my_bookings')}
                      {notifCount > 0 && (
                        <span className="absolute -top-2.5 -right-5 min-w-[18px] h-[18px] bg-gnRed text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-[0_0_10px_rgba(255,0,0,0.5)]">
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
                        <span className="absolute -top-2.5 -right-5 min-w-[18px] h-[18px] bg-gnYellow text-black text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-[0_0_10px_rgba(252,209,22,0.5)]">
                          {msgCount > 99 ? '99+' : msgCount}
                        </span>
                      )}
                    </span>
                  </NavLink>
                  <NavLink to="/favorites" className={navLinkClass}>
                    <HeartIcon className="h-4 w-4" />
                  </NavLink>
                  {(user.role === 'owner' || user.role === 'both') && (
                    <NavLink to="/dashboard" className={navLinkClass}>
                      <ChartBarIcon className="h-4 w-4" />
                    </NavLink>
                  )}
                  {user.is_admin === 1 && (
                    <NavLink to="/admin" className={navLinkClass}>
                      <ShieldCheckIcon className="h-4 w-4" />
                    </NavLink>
                  )}
                </>
              )}
            </div>

            {/* Desktop Auth + Language */}
            <div className="hidden md:flex items-center gap-6">
              <LanguageSwitcher />

              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                  <Link
                    to={`/profile/${user.id}`}
                    className="text-[11px] font-bold text-white uppercase tracking-widest hover:text-gnYellow transition-colors flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-gnRed hover:bg-gnRed/10 rounded-xl transition-all"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                  <NavLink to="/login" className="px-5 py-2.5 text-[10px] font-bold text-white uppercase tracking-widest hover:text-gnYellow transition-colors">
                    {t('nav.login')}
                  </NavLink>
                  <NavLink to="/register" className="bg-gnYellow text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors shadow-[0_0_15px_rgba(252,209,22,0.2)]">
                    {t('nav.register')}
                  </NavLink>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-4">
              <LanguageSwitcher />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 rounded-xl text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu (Déroulant stylisé) */}
          {mobileOpen && (
            <div className="lg:hidden border-t border-white/10 py-4 space-y-2 bg-luxuryBlack/95 backdrop-blur-xl animate-fadeIn">
              <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>{t('nav.home')}</NavLink>
              <NavLink to="/listings" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>{t('nav.listings')}</NavLink>

              {user ? (
                <>
                  <NavLink to="/post-listing" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>{t('nav.post_listing')}</NavLink>
                  <NavLink to="/my-listings" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>{t('nav.my_listings')}</NavLink>
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
                    <HeartIcon className="h-5 w-5" /> {t('nav.favorites')}
                  </NavLink>
                  {(user.role === 'owner' || user.role === 'both') && (
                    <NavLink to="/dashboard" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                      <ChartBarIcon className="h-5 w-5" /> {t('nav.dashboard')}
                    </NavLink>
                  )}
                  {user.is_admin === 1 && (
                    <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                      <ShieldCheckIcon className="h-5 w-5" /> Admin
                    </NavLink>
                  )}
                  <div className="px-4 py-4 border-t border-white/10 mt-4">
                    <p className="text-[10px] font-bold text-gnYellow uppercase tracking-widest mb-4">Connecté en tant que {user.name}</p>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-xs font-bold text-gnRed hover:text-red-400 uppercase tracking-widest transition-colors w-full"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 py-6 border-t border-white/10 mt-2 flex flex-col gap-4">
                  <NavLink to="/login" className="w-full text-center py-3 rounded-xl border border-white/20 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10" onClick={() => setMobileOpen(false)}>
                    {t('nav.login')}
                  </NavLink>
                  <NavLink to="/register" className="w-full text-center py-3 rounded-xl bg-gnYellow text-black font-black text-xs uppercase tracking-widest hover:bg-white" onClick={() => setMobileOpen(false)}>
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