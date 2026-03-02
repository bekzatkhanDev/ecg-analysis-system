import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import enTranslations from './locales/en.json';
import ruTranslations from './locales/ru.json';
import kkTranslations from './locales/kk.json';

// Language resources
const resources = {
  en: {
    translation: enTranslations
  },
  ru: {
    translation: ruTranslations
  },
  kk: {
    translation: kkTranslations
  }
};

i18n
  // Load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  // Learn more: https://github.com/i18next/i18next-http-backend
  .use(Backend)
  // Detect user language
  // Learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Initialize i18next
  // For all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources,
    fallbackLng: 'en',
    debug: true,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // Not needed for react as it escapes by default
    },
    supportedLngs: ['en', 'ru', 'kk'],
    load: 'languageOnly',
  });

export default i18n;