import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getOsInfo, formatUptime } from './os.js';
import { getMemoryInfo, formatBytes } from './memory.js';
import { getCpuSummary, getCpuInfo } from './cpu.js';
import { getDiskInfo } from './disk.js';
import { getPm2Version } from '../pm2/daemon.js';
import { formatVersion } from '../utils/version.js';

const execFileAsync = promisify(execFile);

export async function getNpmVersion() {
  try {
    const { stdout } = await execFileAsync('npm', ['--version'], { encoding: 'utf8' });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function getServerInfo(options = {}) {
  const [cpu, disk, pm2, npm] = await Promise.all([
    getCpuSummary({ sampleMs: options.sampleMs ?? 150 }).catch(() => ({
      ...getCpuInfo(),
      usage: 0,
      loadAverage: null,
    })),
    getDiskInfo().catch(() => null),
    getPm2Version().catch(() => null),
    getNpmVersion(),
  ]);

  const memory = getMemoryInfo();
  const osInfo = getOsInfo();

  return {
    hostname: os.hostname(),
    os: osInfo.distro,
    platform: osInfo.platform,
    platformLabel: osInfo.platformLabel,
    arch: osInfo.arch,
    kernel: osInfo.kernel,
    release: osInfo.release,
    user: osInfo.user,
    hostUptime: osInfo.uptime,
    hostUptimeFormatted: formatUptime(osInfo.uptime),
    node: process.version,
    npm,
    pm2,
    pm2Formatted: pm2 ? formatVersion(pm2) : null,
    cpu,
    memory,
    disk,
    cpuModel: cpu.model,
    cpuCores: cpu.cores,
    memoryTotal: formatBytes(memory.total),
  };
}

export function formatServerInfo(info) {
  return {
    Hostname: info.hostname,
    OS: info.os,
    Architecture: info.arch,
    Kernel: info.kernel,
    Node: info.node,
    NPM: info.npm ?? 'unknown',
    PM2: info.pm2Formatted ?? 'not installed',
    CPU: info.cpuModel,
    'CPU cores': String(info.cpuCores),
    'CPU usage': `${info.cpu.usage}%`,
    Memory: `${info.memory.usedFormatted} / ${info.memory.totalFormatted}`,
    Disk: info.disk
      ? `${info.disk.usedFormatted} / ${info.disk.totalFormatted} (${info.disk.percent}%)`
      : 'unknown',
    Uptime: info.hostUptimeFormatted,
  };
}
