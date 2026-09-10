import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { loadConfig, saveConfig, resetConfig, clearCache } from '../../config/manager.js';
import { printSuccess, printJson } from '../output.js';
import { theme, reloadTheme } from '../../ui/colors.js';
import { InvalidInputError } from '../../utils/errors.js';
import { ensureDir, getMindPM2Home, getConfigPath } from '../../utils/paths.js';
import { confirmDangerous } from './helpers.js';
import { t } from '../../i18n/index.js';

function coerce(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

export async function runConfig(action = 'show', key, value, options = {}) {
  switch (action) {
    case 'show':
    case 'list':
      return show(options);
    case 'get':
      return getKey(key, options);
    case 'set':
      return setKey(key, value, options);
    case 'reset':
      return reset(options);
    case 'path':
      process.stdout.write(`${getConfigPath()}\n`);
      return getConfigPath();
    case 'edit':
      return edit();
    default:
      throw new InvalidInputError(t('error.unknownAction', { action }));
  }
}

function show(options = {}) {
  const config = loadConfig();
  if (options.json) {
    printJson(config);
    return config;
  }
  process.stdout.write(`${theme.primaryBold(t('config.title'))}\n`);
  process.stdout.write(`${theme.muted(getConfigPath())}\n\n`);
  const width = Math.max(...Object.keys(config).map((item) => item.length));
  for (const [item, val] of Object.entries(config)) {
    process.stdout.write(`${theme.muted(`${item}:`.padEnd(width + 2))}${val}\n`);
  }
  return config;
}

function getKey(key, options = {}) {
  if (!key) throw new InvalidInputError(t('error.noConfigKey'));
  const config = loadConfig();
  if (!(key in config)) throw new InvalidInputError(t('error.unknownConfigKey', { key }));
  const value = config[key];
  if (options.json) {
    printJson({ [key]: value });
  } else {
    process.stdout.write(`${value}\n`);
  }
  return value;
}

function setKey(key, rawValue, options = {}) {
  if (!key) throw new InvalidInputError(t('error.noConfigKey'));
  const config = loadConfig();
  if (!(key in config)) throw new InvalidInputError(t('error.unknownConfigKey', { key }));
  const value = coerce(rawValue);
  const updated = saveConfig({ ...config, [key]: value });
  clearCache();
  if (key === 'theme') reloadTheme(value);
  if (!options.json) printSuccess(t('config.set', { key, value: updated[key] }));
  return updated[key];
}

async function reset(options = {}) {
  const ok = await confirmDangerous(t('config.confirmReset'), options);
  if (!ok) return { cancelled: true };
  resetConfig();
  clearCache();
  reloadTheme(loadConfig().theme);
  printSuccess(t('config.resetDone'));
  return true;
}

function edit() {
  const file = getConfigPath();
  ensureDir(getMindPM2Home());
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `${JSON.stringify(loadConfig(), null, 2)}\n`, 'utf8');
  }
  const editor =
    process.env.VISUAL || process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'vi');
  return new Promise((resolve, reject) => {
    const child = spawn(editor, [file], { stdio: 'inherit', shell: false });
    child.on('exit', (code) => {
      clearCache();
      if (code === 0) resolve(file);
      else reject(new InvalidInputError(t('error.editorFailed', { code })));
    });
    child.on('error', reject);
  });
}

export default runConfig;
