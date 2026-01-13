import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// JSON dosyalarını direkt import et (Next.js bunları otomatik olarak handle eder)
import tr from '../../locales/tr/common.json';
import en from '../../locales/en/common.json';
import fr from '../../locales/fr/common.json';

// i18n'i sadece client-side'da initialize et
if (typeof window !== 'undefined' && !i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        tr: { common: tr },
        en: { common: en },
        fr: { common: fr },
      },
      fallbackLng: 'fr',
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
        // localStorage'da değer yoksa FR kullan
        checkWhitelist: true,
      },
    });
}

// Server-side için minimal initialization (sadece hook'ların çalışması için)
if (typeof window === 'undefined' && !i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        tr: { common: tr },
        en: { common: en },
        fr: { common: fr },
      },
      lng: 'fr',
      fallbackLng: 'fr',
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
