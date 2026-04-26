import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    localStorage.setItem('rentcar_lang', newLang);
  };

  const currentLang = i18n.language === 'fr' ? 'fr' : 'en';

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
      title={currentLang === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <span className="text-base leading-none">
        {currentLang === 'fr' ? '🇫🇷' : '🇬🇧'}
      </span>
      <span className="uppercase font-semibold text-xs tracking-wider">
        {currentLang === 'fr' ? 'FR' : 'EN'}
      </span>
    </button>
  );
}
