import fs from 'node:fs';
import { getConfigPath, getMindPM2Home, ensureDir } from '../utils/paths.js';
import { DEFAULT_CONFIG, validateConfig } from './defaults.js';
import { logger } from '../utils/logger.js';

let cached = null;

export function loadConfig() {
  if (cached) return cached;
  let stored = {};
  const file = getConfigPath();
  try {
    if (fs.existsSync(file)) {
      stored = JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (error) {
    logger.warn(`Kon configuratie niet lezen: ${error.message}`);
    stored = {};
  }
  cached = { ...DEFAULT_CONFIG, ...stored };
  return cached;
}

export function saveConfig(config) {
  const merged = { ...DEFAULT_CONFIG, ...config };
  const errors = validateConfig(merged);
  if (errors.length > 0) {
    const error = new Error(`Ongeldige configuratie:\n- ${errors.join('\n- ')}`);
    error.validationErrors = errors;
    throw error;
  }
  ensureDir(getMindPM2Home());
  fs.writeFileSync(getConfigPath(), `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  cached = merged;
  return merged;
}

export function get(key) {
  return loadConfig()[key];
}

export function set(key, value) {
  const config = { ...loadConfig(), [key]: value };
  return saveConfig(config);
}

export function resetConfig() {
  return saveConfig({ ...DEFAULT_CONFIG });
}

export function configExists() {
  return fs.existsSync(getConfigPath());
}

export function clearCache() {
  cached = null;
}

export { DEFAULT_CONFIG, validateConfig };
