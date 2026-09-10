import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execPm2 } from './daemon.js';
import { detectEcosystemFile, detectEcosystemFiles, getMindPM2Home, ensureDir } from '../utils/paths.js';
import { InvalidInputError } from '../utils/errors.js';

export function detect(cwd = process.cwd()) {
  return detectEcosystemFile(cwd);
}

export function detectAll(cwd = process.cwd()) {
  return detectEcosystemFiles(cwd);
}

export async function parse(filePath) {
  if (!filePath) throw new InvalidInputError('Geen ecosystem-bestand opgegeven.');
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new InvalidInputError(`Ecosystem-bestand niet gevonden: ${resolved}`);
  }
  const ext = path.extname(resolved).toLowerCase();
  if (ext === '.json') {
    const content = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    return normalizeConfig(content, resolved);
  }
  const url = `${pathToFileURL(resolved).href}?t=${Date.now()}`;
  const imported = await import(url);
  const config = imported?.default ?? imported?.config ?? imported;
  return normalizeConfig(config, resolved);
}

function normalizeConfig(config, filePath) {
  if (!config || typeof config !== 'object') {
    throw new InvalidInputError(`Ongeldige ecosystem-configuratie in ${filePath}`);
  }
  const apps = Array.isArray(config.apps) ? config.apps : [];
  return {
    path: filePath,
    apps: apps.map((app) => ({
      name: app.name ?? 'unnamed',
      script: app.script ?? null,
      cwd: app.cwd ?? null,
      instances: app.instances ?? 1,
      execMode: app.exec_mode ?? 'fork',
      watch: Boolean(app.watch),
      env: app.env ?? {},
    })),
    raw: config,
  };
}

export async function listApps(filePath) {
  const config = await parse(filePath);
  return config.apps;
}

export function start(filePath) {
  return execPm2(['start', path.resolve(filePath)], { timeout: 60000 });
}

export function stop(filePath) {
  return execPm2(['stop', path.resolve(filePath)], { timeout: 60000 });
}

export function reload(filePath) {
  return execPm2(['reload', path.resolve(filePath)], { timeout: 60000 });
}

export function restart(filePath) {
  return execPm2(['restart', path.resolve(filePath)], { timeout: 60000 });
}

export function remove(filePath) {
  return execPm2(['delete', path.resolve(filePath)], { timeout: 60000 });
}

export async function validate(filePath) {
  const config = await parse(filePath);
  const errors = [];
  const warnings = [];
  if (config.apps.length === 0) {
    warnings.push('Configuratie bevat geen applicaties.');
  }
  config.apps.forEach((app, index) => {
    if (!app.name || app.name === 'unnamed') {
      errors.push(`App #${index + 1} mist een "name".`);
    }
    if (!app.script) {
      warnings.push(`App "${app.name}" mist een "script".`);
    }
  });
  return { valid: errors.length === 0, errors, warnings, apps: config.apps };
}

export function createTemplate(name = 'ecosystem.config.cjs') {
  const template = `module.exports = {
  apps: [
    {
      name: 'app',
      script: './index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
`;
  const target = path.resolve(process.cwd(), name);
  if (fs.existsSync(target)) {
    throw new InvalidInputError(`Bestand bestaat al: ${target}`);
  }
  fs.writeFileSync(target, template, 'utf8');
  return target;
}

export function ensureSampleDir() {
  const dir = path.join(getMindPM2Home(), 'templates');
  ensureDir(dir);
  return dir;
}
