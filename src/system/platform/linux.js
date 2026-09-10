import fs from 'node:fs';
import { getDiskInfo } from '../disk.js';

export const id = 'linux';
export const name = 'Linux';

export function getInitSystem() {
  if (fs.existsSync('/run/systemd/system')) return 'systemd';
  if (fs.existsSync('/etc/init.d')) return 'sysv';
  return 'unknown';
}

export function getStartupServiceName(user) {
  return `pm2-${user}`;
}

export function supportsStartup() {
  return getInitSystem() !== 'unknown';
}

export function getOpenCommand(dir) {
  return { command: 'xdg-open', args: [dir] };
}

export async function getDisk(targetPath) {
  return getDiskInfo(targetPath);
}
