'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const languages = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'tr', label: 'TR' },
  ];

  // Server-side render için default olarak 'fr' seçili göster
  // i18n.language undefined olabilir, bu yüzden fallback ekliyoruz
  const currentLanguage = mounted && i18n?.language ? i18n.language.split('-')[0] : 'fr';

  const handleLanguageChange = (langCode: string) => {
    if (mounted && i18n && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(langCode);
      // i18next-browser-languagedetector otomatik olarak localStorage'a kaydediyor
    }
  };

  return (
    <div className="flex items-center gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
            currentLanguage === lang.code
              ? 'bg-[#E91E63] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-[#E91E63]/10 hover:text-[#E91E63]'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
