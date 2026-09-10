import { en } from './en.js';
import { nl } from './nl.js';
import { loadConfig } from '../config/manager.js';

const LOCALES = { en, nl };
export const SUPPORTED_LOCALES = Object.keys(LOCALES);

let cached = null;

export function detectLocale() {
  const override = process.env.MINDPM2_LANG;
  if (override) return SUPPORTED_LOCALES.includes(override) ? override : 'en';

  let configured = 'auto';
  try {
    configured = loadConfig().language ?? 'auto';
  } catch {
    configured = 'auto';
  }
  if (SUPPORTED_LOCALES.includes(configured)) return configured;

  const env = (process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || 'en').toLowerCase();
  if (env.startsWith('nl')) return 'nl';
  return 'en';
}

export function getLocale() {
  if (!cached) cached = detectLocale();
  return cached;
}

export function setLocale(locale) {
  if (SUPPORTED_LOCALES.includes(locale)) cached = locale;
}

export function resetLocale() {
  cached = null;
}

export function translate(locale, key, params = {}) {
  const dict = LOCALES[locale] ?? en;
  let value = dict[key] ?? en[key] ?? key;
  if (typeof value === 'function') value = value(params);
  return String(value).replace(/\{(\w+)\}/g, (match, name) =>
    params[name] !== undefined ? String(params[name]) : match
  );
}

export function t(key, params = {}) {
  return translate(getLocale(), key, params);
}

export { en, nl };
