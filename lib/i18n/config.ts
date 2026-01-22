import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// JSON dosyalarını direkt import et (Next.js bunları otomatik olarak handle eder)
import tr from '../../locales/tr/common.json';
import en from '../../locales/en/common.json';
import fr from '../../locales/fr/common.json';

// i18n'i her zaman initialize et (hem client hem server için)
if (!i18n.isInitialized) {
  const isClient = typeof window !== 'undefined';
  
  const config = {
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
  };

  if (isClient) {
    // Client-side: LanguageDetector ekle
    i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        ...config,
        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage'],
          lookupLocalStorage: 'i18nextLng',
        },
      });
  } else {
    // Server-side: sadece initReactI18next ekle
    i18n
      .use(initReactI18next)
      .init(config);
  }
}

export default i18n;
