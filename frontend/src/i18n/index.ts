import { setFormatLocale } from '@manabandhu/core';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { en } from './en';
import { hi } from './hi';
import { te } from './te';

export const supportedLanguages = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
] as const;

export type LanguageCode = (typeof supportedLanguages)[number]['code'];
export type LanguagePreference = 'system' | LanguageCode;

function deviceLanguage(): LanguageCode {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return supportedLanguages.some((l) => l.code === code) ? (code as LanguageCode) : 'en';
}

export function resolveLanguage(preference: LanguagePreference): LanguageCode {
  return preference === 'system' ? deviceLanguage() : preference;
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, te: { translation: te }, hi: { translation: hi } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** Switches UI strings and number/date formatting together. */
export function applyLanguage(preference: LanguagePreference) {
  const language = resolveLanguage(preference);
  if (i18n.language !== language) i18n.changeLanguage(language);
  const regional = getLocales().find((l) => l.languageCode === language)?.languageTag;
  setFormatLocale(regional ?? (language === 'en' ? undefined : `${language}-IN`));
}

/** Typed translation hook: `t('home.quickAccess')`. */
export function useT() {
  return useTranslation().t;
}

export default i18n;
