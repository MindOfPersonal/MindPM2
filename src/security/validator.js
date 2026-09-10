import { InvalidInputError } from '../utils/errors.js';
import { t } from '../i18n/index.js';

const PROCESS_ID_PATTERN = /^[A-Za-z0-9 ._@:+/-]+$/;
const MEMORY_PATTERN = /^\d+(\.\d+)?\s?(B|K|KB|M|MB|G|GB)?$/i;

export function isValidProcessId(value) {
  return typeof value === 'string' && /^\d+$/.test(value.trim());
}

export function isValidProcessName(value) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= 200 &&
    PROCESS_ID_PATTERN.test(value.trim())
  );
}

export function validateProcessIdentifier(value) {
  const input = String(value ?? '').trim();
  if (!input) {
    throw new InvalidInputError(t('error.noProcess'));
  }
  if (isValidProcessId(input)) return input;
  if (isValidProcessName(input)) return input;
  throw new InvalidInputError(t('error.invalidProcess', { input }));
}

export function validateMemory(value) {
  if (value === undefined || value === null || value === '') return null;
  const input = String(value).trim();
  if (!MEMORY_PATTERN.test(input)) {
    throw new InvalidInputError(t('error.invalidMemory', { input }));
  }
  return input.toUpperCase().replace(/\s+/g, '');
}

export function validateInstances(value) {
  if (value === undefined || value === null || value === '') return null;
  const input = String(value).trim();
  if (input === 'max') return 'max';
  const num = Number(input);
  if (!Number.isInteger(num) || num < 1 || num > 128) {
    throw new InvalidInputError(t('error.invalidInstances', { input }));
  }
  return num;
}

export function validatePort(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 65535) {
    throw new InvalidInputError(t('error.invalidPort', { input: value }));
  }
  return num;
}

export function validateScriptPath(input, fsModule) {
  const fs = fsModule;
  const value = String(input ?? '').trim();
  if (!value) {
    throw new InvalidInputError(t('error.noScript'));
  }
  if (value.includes('\0')) {
    throw new InvalidInputError(t('error.pathChars'));
  }
  if (fs) {
    try {
      fs.accessSync(value);
    } catch {
      throw new InvalidInputError(t('error.invalidPath', { path: value }));
    }
  }
  return value;
}

export function validateCommandArgs(args) {
  if (args === undefined || args === null) return [];
  const list = Array.isArray(args) ? args : [args];
  return list.map((arg) => String(arg));
}

export function assertSafePath(targetPath) {
  const value = String(targetPath ?? '');
  if (value.includes('\0')) {
    throw new InvalidInputError(t('error.pathChars'));
  }
  return value;
}
