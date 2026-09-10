import os from 'node:os';

export function formatBytes(bytes, decimals = 2) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** index;
  return `${size.toFixed(index === 0 ? 0 : decimals)} ${units[index]}`;
}

export function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    total,
    free,
    used,
    percent: total > 0 ? Number(((used / total) * 100).toFixed(1)) : 0,
    totalFormatted: formatBytes(total),
    usedFormatted: formatBytes(used),
    freeFormatted: formatBytes(free),
  };
}
