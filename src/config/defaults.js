import { THEME_NAMES } from '../ui/themes.js';

export const DEFAULT_CONFIG = {
  theme: 'default',
  language: 'auto',
  autoRefresh: true,
  refreshInterval: 3000,
  showLogo: true,
  confirmDangerousActions: true,
  maskEnvironmentVariables: true,
  monitorInterval: 2000,
  logLines: 50,
  trustPlatform: true,
};

export const LANGUAGES = ['auto', 'en', 'nl'];

export function validateConfig(config) {
  const errors = [];
  if (config.refreshInterval !== undefined) {
    const value = Number(config.refreshInterval);
    if (!Number.isInteger(value) || value < 500 || value > 60000) {
      errors.push('refreshInterval must be an integer between 500 and 60000.');
    }
  }
  if (config.monitorInterval !== undefined) {
    const value = Number(config.monitorInterval);
    if (!Number.isInteger(value) || value < 500 || value > 60000) {
      errors.push('monitorInterval must be an integer between 500 and 60000.');
    }
  }
  if (config.logLines !== undefined) {
    const value = Number(config.logLines);
    if (!Number.isInteger(value) || value < 1 || value > 10000) {
      errors.push('logLines must be an integer between 1 and 10000.');
    }
  }
  if (config.theme !== undefined && !THEME_NAMES.includes(config.theme)) {
    errors.push(`theme must be one of: ${THEME_NAMES.join(', ')}`);
  }
  if (config.language !== undefined && !LANGUAGES.includes(config.language)) {
    errors.push(`language must be one of: ${LANGUAGES.join(', ')}`);
  }
  return errors;
}
