const SENSITIVE_KEY_PATTERN =
  /(pass(word|wd)?|secret|token|api[_-]?key|apikey|auth(orization)?|private[_-]?key|credential|access[_-]?key|client[_-]?secret|session|cookie)/i;

export function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERN.test(String(key));
}

export const MASK = '********';

export function maskEnvVars(env, options = {}) {
  const { reveal = false } = options;
  if (!env || typeof env !== 'object') return {};
  const result = {};
  for (const [key, value] of Object.entries(env)) {
    if (!reveal && isSensitiveKey(key)) {
      result[key] = MASK;
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function stripAnsi(value) {
  // eslint-disable-next-line no-control-regex
  return String(value).replace(/\u001b\[[0-9;]*m/g, '');
}

export function escapeShellArg(value) {
  const str = String(value);
  if (process.platform === 'win32') {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `'${str.replace(/'/g, `'\\''`)}'`;
}

export function sanitizeText(value, maxLength = 2000) {
  const str = String(value ?? '');
  return str.replace(/\u0000/g, '').slice(0, maxLength);
}

const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function formatEnvValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function formatEnvEntries(env, options = {}) {
  const masked = maskEnvVars(env, options);
  return Object.entries(masked)
    .filter(([key]) => ENV_KEY_PATTERN.test(key))
    .map(([key, value]) => [key, formatEnvValue(value)]);
}
