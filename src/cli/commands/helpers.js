import path from 'node:path';
import fs from 'node:fs';
import { confirmPrompt } from '../prompts.js';
import { loadConfig } from '../../config/manager.js';
import { ECOSYSTEM_FILENAMES } from '../../utils/paths.js';

export function isEcosystemPath(target) {
  if (!target) return false;
  const base = path.basename(String(target));
  return ECOSYSTEM_FILENAMES.includes(base);
}

export function existingFile(target) {
  if (!target) return false;
  try {
    return fs.statSync(target).isFile();
  } catch {
    return false;
  }
}

export async function confirmDangerous(message, options = {}) {
  if (options.yes) return true;
  const config = loadConfig();
  if (!config.confirmDangerousActions && !options.force) {
    return true;
  }
  const answer = await confirmPrompt(message, { default: options.default ?? false });
  return answer === true;
}

export function sortProcesses(processes, sortBy = 'id') {
  const sorted = [...processes];
  const direction = sortBy.startsWith('-') ? -1 : 1;
  const key = sortBy.replace(/^[-+]/, '') || 'id';
  sorted.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction;
    return String(av ?? '').localeCompare(String(bv ?? '')) * direction;
  });
  return sorted;
}
