import { getDiskInfo } from '../disk.js';

export const id = 'darwin';
export const name = 'macOS';

export function getInitSystem() {
  return 'launchd';
}

export function getStartupServiceName(user) {
  return `com.pm2.${user}`;
}

export function supportsStartup() {
  return true;
}

export function getOpenCommand(dir) {
  return { command: 'open', args: [dir] };
}

export async function getDisk(targetPath) {
  return getDiskInfo(targetPath);
}
