import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { parseVersion, compareVersions } from '../utils/version.js';
import { Pm2UnavailableError, CommandError } from '../utils/errors.js';
import { debug } from '../utils/debug.js';

const execFileAsync = promisify(execFile);

const PM2_BIN = process.platform === 'win32' ? 'pm2.cmd' : 'pm2';

let versionCache = null;
let apiModule;
let apiChecked = false;

export function getPm2Binary() {
  return process.env.MINDPM2_PM2_BIN || PM2_BIN;
}

export async function execPm2(args = [], options = {}) {
  const bin = getPm2Binary();
  const argv = Array.isArray(args) ? args.map(String) : [String(args)];
  debug(`exec: ${bin} ${argv.join(' ')}`);
  try {
    const { stdout, stderr } = await execFileAsync(bin, argv, {
      encoding: 'utf8',
      maxBuffer: options.maxBuffer ?? 20 * 1024 * 1024,
      timeout: options.timeout ?? 30000,
      cwd: options.cwd ?? process.cwd(),
      env: { ...process.env, ...(options.env ?? {}) },
      windowsHide: true,
    });
    return { stdout: stdout ?? '', stderr: stderr ?? '', code: 0 };
  } catch (error) {
    const wrapped = new CommandError(
      error?.stderr?.trim() || error?.message || 'PM2 commando mislukt.',
      {
        command: `${bin} ${argv.join(' ')}`,
        code: error?.code ?? 1,
        stdout: error?.stdout ?? '',
        stderr: error?.stderr ?? '',
        cause: error,
      }
    );
    throw wrapped;
  }
}

export function spawnPm2(args = [], options = {}) {
  const bin = getPm2Binary();
  const argv = Array.isArray(args) ? args.map(String) : [String(args)];
  debug(`spawn: ${bin} ${argv.join(' ')}`);
  return spawn(bin, argv, {
    stdio: options.stdio ?? ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, ...(options.env ?? {}) },
    cwd: options.cwd ?? process.cwd(),
    windowsHide: true,
  });
}

export async function isPm2Installed() {
  try {
    await execPm2(['--version'], { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

export async function getPm2Version({ refresh = false } = {}) {
  if (versionCache && !refresh) return versionCache;
  try {
    const { stdout } = await execPm2(['--version'], { timeout: 10000 });
    versionCache = stdout.trim().replace(/^v/i, '');
    return versionCache;
  } catch (error) {
    throw new Pm2UnavailableError(undefined, { cause: error });
  }
}

export async function isDaemonRunning() {
  try {
    const { stdout } = await execPm2(['ping'], { timeout: 10000 });
    return /pong/i.test(stdout);
  } catch {
    return false;
  }
}

export async function ping() {
  try {
    const { stdout } = await execPm2(['ping'], { timeout: 10000 });
    return /pong/i.test(stdout);
  } catch {
    return false;
  }
}

export async function jlist() {
  const { stdout } = await execPm2(['jlist'], { timeout: 20000 });
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    throw new Pm2UnavailableError('PM2 gaf een onverwacht antwoord terug.', {
      technical: trimmed.slice(0, 500),
      cause: error,
    });
  }
}

export function supportsVersion(version, minimum) {
  if (!version) return false;
  return compareVersions(version, minimum) >= 0;
}

export { parseVersion, compareVersions };

export async function loadPm2Api() {
  if (apiChecked) return apiModule;
  apiChecked = true;
  try {
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    apiModule = require('pm2');
    return apiModule;
  } catch {
    apiModule = null;
    return null;
  }
}

export async function ensurePm2Available() {
  if (!(await isPm2Installed())) {
    throw new Pm2UnavailableError();
  }
}
