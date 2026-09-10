import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { execPm2 } from './daemon.js';
import { getCurrentUser } from '../security/permissions.js';
import { isLinux, isMacOS, isWindows, platformLabel } from '../utils/platform.js';

export function save() {
  return execPm2(['save'], { timeout: 60000 });
}

export function resurrect() {
  return execPm2(['resurrect'], { timeout: 60000 });
}

export async function generateStartupCommand() {
  try {
    const { stdout } = await execPm2(['startup'], { timeout: 60000 });
    return { output: stdout, command: extractCommand(stdout) };
  } catch (error) {
    if (error.stdout || error.stderr) {
      const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
      return { output, command: extractCommand(output) };
    }
    throw error;
  }
}

export function extractCommand(output) {
  const match = String(output).match(/^\s*(sudo .*)$/m);
  return match ? match[1].trim() : null;
}

export function detectInitSystem() {
  if (isWindows()) return 'windows';
  if (isMacOS()) return 'launchd';
  if (isLinux()) {
    if (fs.existsSync('/run/systemd/system')) return 'systemd';
    if (fs.existsSync('/etc/init.d')) return 'sysv';
    return 'unknown';
  }
  return 'unknown';
}

export function getStartupStatus() {
  const initSystem = detectInitSystem();
  const supported = initSystem !== 'unknown';
  const user = getCurrentUser();
  let enabled = false;
  let serviceName = null;

  if (initSystem === 'systemd') {
    serviceName = `pm2-${user}`;
    enabled = checkSystemdServiceEnabled(serviceName);
  }

  return {
    platform: platformLabel(),
    initSystem,
    supported,
    user,
    serviceName,
    enabled,
  };
}

function checkSystemdServiceEnabled(serviceName) {
  try {
    const output = execFileSync('systemctl', ['is-enabled', serviceName], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.trim() === 'enabled';
  } catch {
    return false;
  }
}

export function unstartup(platform) {
  const args = ['unstartup'];
  if (platform) args.push(platform);
  return execPm2(args, { timeout: 60000 });
}
