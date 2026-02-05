import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en_US from './locales/en_US.json';
import es_MX from './locales/es_MX.json';

const resources = {
  en_US: { translation: en_US },
  es_MX: { translation: es_MX },
};

const isDev = import.meta.env.DEV;
const languageStorageKey = 'navilla_language';

const getDevLanguage = () => {
  try {
    return localStorage.getItem(languageStorageKey) || 'en_US';
  } catch {
    return 'en_US';
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en_US',
    supportedLngs: ['en_US', 'es_MX'],
    ...(isDev ? { lng: getDevLanguage() } : {}),

    detection: {
      order: isDev ? ['localStorage'] : ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: languageStorageKey,
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
