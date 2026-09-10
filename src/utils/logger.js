import fs from 'node:fs';
import path from 'node:path';
import { getLogsDir } from './paths.js';

const MAX_LOG_SIZE = 1024 * 1024; // 1 MB
const SECRET_PATTERN =
  /(password|passwd|secret|token|api[_-]?key|authorization)\s*[:=]\s*\S+/gi;

let initialized = false;

function redact(value) {
  if (typeof value !== 'string') return value;
  return value.replace(SECRET_PATTERN, (match) => match.replace(/[:=]\s*\S+/, ': ********'));
}

function rotate(file) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > MAX_LOG_SIZE) {
      fs.renameSync(file, `${file}.1`);
    }
  } catch {
    /* ignore */
  }
}

function write(level, message) {
  try {
    const dir = getLogsDir();
    if (!initialized) {
      fs.mkdirSync(dir, { recursive: true });
      initialized = true;
    }
    const timestamp = new Date().toISOString();
    const line = `${timestamp} [${level}] ${redact(String(message))}\n`;
    const file = path.join(dir, level === 'ERROR' ? 'errors.log' : 'mindpm2.log');
    rotate(file);
    fs.appendFileSync(file, line);
  } catch {
    /* Logging mag nooit de applicatie laten crashen */
  }
}

export const logger = {
  info: (message) => write('INFO', message),
  warn: (message) => write('WARN', message),
  error: (message) => write('ERROR', message),
  debug: (message) => write('DEBUG', message),
};
