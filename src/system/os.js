import os from 'node:os';
import fs from 'node:fs';
import { platformLabel } from '../utils/platform.js';

export function getDistro() {
  if (process.platform === 'darwin') {
    return `macOS ${os.release()}`;
  }
  if (process.platform === 'win32') {
    return `Windows ${os.release()}`;
  }
  try {
    const content = fs.readFileSync('/etc/os-release', 'utf8');
    const values = Object.fromEntries(
      content
        .split('\n')
        .filter((line) => line.includes('='))
        .map((line) => {
          const [key, ...rest] = line.split('=');
          return [key, rest.join('=').replace(/^"|"$/g, '')];
        })
    );
    return values.PRETTY_NAME || values.NAME || platformLabel();
  } catch {
    return platformLabel();
  }
}

export function getOsInfo() {
  return {
    platform: process.platform,
    platformLabel: platformLabel(),
    distro: getDistro(),
    release: os.release(),
    kernel: os.release(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: os.uptime(),
    endianness: os.endianness(),
    tmpdir: os.tmpdir(),
    homedir: os.homedir(),
    user: safeUser(),
  };
}

function safeUser() {
  try {
    return os.userInfo().username;
  } catch {
    return process.env.USER || process.env.USERNAME || 'unknown';
  }
}

export function formatUptime(seconds) {
  const total = Math.floor(Number(seconds) || 0);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const parts = [];
  if (days > 0) parts.push(`${days} days`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${secs}s`);
  return parts.join(' ');
}
