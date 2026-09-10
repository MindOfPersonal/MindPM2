import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export const ECOSYSTEM_FILENAMES = [
  'ecosystem.config.js',
  'ecosystem.config.cjs',
  'ecosystem.config.mjs',
  'ecosystem.config.json',
  'ecosystem.js',
  'ecosystem.json',
];

export function getHomeDir() {
  return os.homedir();
}

export function getMindPM2Home() {
  if (process.env.MINDPM2_HOME) return process.env.MINDPM2_HOME;
  return path.join(getHomeDir(), '.mindpm2');
}

export function getConfigPath() {
  return path.join(getMindPM2Home(), 'config.json');
}

export function getLogsDir() {
  return path.join(getMindPM2Home(), 'logs');
}

export function getPm2Home() {
  if (process.env.PM2_HOME) return process.env.PM2_HOME;
  return path.join(getHomeDir(), '.pm2');
}

export function getPm2DumpPath() {
  return path.join(getPm2Home(), 'dump.pm2');
}

export function getPm2LogsDir() {
  return path.join(getPm2Home(), 'logs');
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function isReadable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function isWritable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function detectEcosystemFile(cwd = process.cwd()) {
  for (const name of ECOSYSTEM_FILENAMES) {
    const candidate = path.join(cwd, name);
    if (fileExists(candidate)) return candidate;
  }
  return null;
}

export function detectEcosystemFiles(cwd = process.cwd()) {
  return ECOSYSTEM_FILENAMES.map((name) => path.join(cwd, name)).filter(fileExists);
}

export function resolveInputPath(input, cwd = process.cwd()) {
  if (!input) return cwd;
  return path.isAbsolute(input) ? path.normalize(input) : path.resolve(cwd, input);
}
