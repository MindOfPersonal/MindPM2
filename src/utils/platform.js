import os from 'node:os';

export const SUPPORTED_PLATFORMS = ['linux', 'darwin', 'win32'];

export function getPlatform() {
  return process.platform;
}

export function getArch() {
  return process.arch;
}

export function platformLabel(platform = process.platform) {
  switch (platform) {
    case 'darwin':
      return 'macOS';
    case 'win32':
      return 'Windows';
    case 'linux':
      return 'Linux';
    default:
      return platform;
  }
}

export function isLinux() {
  return process.platform === 'linux';
}

export function isWindows() {
  return process.platform === 'win32';
}

export function isMacOS() {
  return process.platform === 'darwin';
}

export function isSupportedPlatform() {
  return SUPPORTED_PLATFORMS.includes(process.platform);
}

export function getHostname() {
  return os.hostname();
}
