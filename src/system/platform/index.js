import * as linux from './linux.js';
import * as windows from './windows.js';
import * as macos from './macos.js';

const PLATFORMS = {
  linux,
  win32: windows,
  darwin: macos,
};

export function getPlatformModule(platform = process.platform) {
  return PLATFORMS[platform] ?? null;
}

export function getInitSystem() {
  return getPlatformModule()?.getInitSystem() ?? 'unknown';
}

export function supportsStartup() {
  return getPlatformModule()?.supportsStartup() ?? false;
}

export function getStartupServiceName(user) {
  return getPlatformModule()?.getStartupServiceName(user) ?? null;
}

export function getOpenCommand(dir) {
  const module = getPlatformModule();
  if (!module) return null;
  return module.getOpenCommand(dir);
}

export { linux, windows, macos };
