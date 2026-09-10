import { getDiskInfo } from '../disk.js';

export const id = 'win32';
export const name = 'Windows';

export function getInitSystem() {
  return 'windows-service';
}

export function getStartupServiceName() {
  return 'pm2-windows-service';
}

export function supportsStartup() {
  return true;
}

export function getOpenCommand(dir) {
  return { command: 'explorer', args: [dir] };
}

export async function getDisk(targetPath) {
  return getDiskInfo(targetPath);
}
