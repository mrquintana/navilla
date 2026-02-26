import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en_US from './locales/en_US.json';
import es_MX from './locales/es_MX.json';
import { detectLanguage } from './lib/geolocation';
import { env } from './lib/env';

const resources = {
  en_US: { translation: en_US },
  es_MX: { translation: es_MX },
};

const isDev = env.DEV;
const languageStorageKey = 'navilla_language';

const getDevLanguage = () => {
  try {
    return localStorage.getItem(languageStorageKey) || 'en_US';
  } catch {
    return 'en_US';
  }
};

// Custom detector: timezone + browser locale → supported language code.
// Runs after localStorage (user preference always wins).
const timezoneLocaleDetector = {
  name: 'timezoneLocale',
  lookup() {
    return detectLanguage();
  },
  cacheUserLanguage() {
    // Detection only — caching is handled by the localStorage detector.
  },
};

const detector = new LanguageDetector();
detector.addDetector(timezoneLocaleDetector);

i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en_US',
    supportedLngs: ['en_US', 'es_MX'],
    ...(isDev ? { lng: getDevLanguage() } : {}),

    detection: {
      order: isDev ? ['localStorage'] : ['localStorage', 'timezoneLocale'],
      caches: ['localStorage'],
      lookupLocalStorage: languageStorageKey,
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
