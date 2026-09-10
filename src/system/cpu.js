import os from 'node:os';

export function getCpuInfo() {
  const cpus = os.cpus();
  return {
    model: cpus[0]?.model?.trim() ?? 'Unknown',
    cores: cpus.length,
    speed: cpus[0]?.speed ?? 0,
  };
}

export function getLoadAverage() {
  const load = os.loadavg();
  if (process.platform === 'win32') return null;
  if (load.every((value) => value === 0)) return null;
  return { one: load[0], five: load[1], fifteen: load[2] };
}

function snapshot() {
  const cpus = os.cpus();
  return cpus.reduce(
    (acc, cpu) => {
      const total = Object.values(cpu.times).reduce((sum, value) => sum + value, 0);
      acc.idle += cpu.times.idle;
      acc.total += total;
      return acc;
    },
    { idle: 0, total: 0 }
  );
}

export function getCpuUsage(sampleMs = 200) {
  return new Promise((resolve) => {
    const start = snapshot();
    setTimeout(() => {
      const end = snapshot();
      const idleDiff = end.idle - start.idle;
      const totalDiff = end.total - start.total;
      const usage = totalDiff > 0 ? 100 - (100 * idleDiff) / totalDiff : 0;
      resolve(Math.max(0, Math.min(100, Number(usage.toFixed(1)))));
    }, sampleMs);
  });
}

export async function getCpuSummary(options = {}) {
  const info = getCpuInfo();
  const usage = await getCpuUsage(options.sampleMs ?? 200);
  return {
    ...info,
    usage,
    loadAverage: getLoadAverage(),
  };
}
