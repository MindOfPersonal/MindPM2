import fs from 'node:fs';
import os from 'node:os';
import { getPm2Home, getMindPM2Home } from '../utils/paths.js';
import { PermissionError } from '../utils/errors.js';

export function isRoot() {
  if (process.platform === 'win32') {
    return false;
  }
  return typeof process.getuid === 'function' && process.getuid() === 0;
}

export function getCurrentUser() {
  try {
    return os.userInfo().username;
  } catch {
    return process.env.USER || process.env.USERNAME || 'unknown';
  }
}

export function canRead(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function canWrite(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function canAccess(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function assertCanWrite(targetPath, message) {
  if (!canWrite(targetPath)) {
    throw new PermissionError(message ?? `Geen schrijfrechten voor: ${targetPath}`);
  }
}

export function getPermissionSummary() {
  const pm2Home = getPm2Home();
  const mindHome = getMindPM2Home();
  return {
    isRoot: isRoot(),
    pm2Home,
    pm2HomeExists: canAccess(pm2Home),
    pm2HomeReadable: canRead(pm2Home),
    pm2HomeWritable: canWrite(pm2Home),
    mindHome,
    mindHomeWritable: canWrite(mindHome) || !canAccess(mindHome),
  };
}

export function requiresElevation() {
  return !isRoot() && process.platform !== 'win32';
}
