import { listProcesses } from '../../pm2/processes.js';
import { getCpuUsage, getLoadAverage } from '../../system/cpu.js';
import { getMemoryInfo } from '../../system/memory.js';
import { getDiskInfo } from '../../system/disk.js';
import { theme } from '../../ui/colors.js';
import { monitorBox } from '../../ui/boxes.js';
import { printJson } from '../output.js';
import { loadConfig } from '../../config/manager.js';
import { t } from '../../i18n/index.js';

export async function collectMonitorData() {
  const [cpu, processes, disk] = await Promise.all([
    getCpuUsage(150),
    listProcesses().catch(() => []),
    getDiskInfo().catch(() => null),
  ]);
  const memory = getMemoryInfo();
  return { cpu, memory, processes, disk, load: getLoadAverage() };
}

export function renderMonitorFrame(data, options = {}) {
  const footer =
    options.autoRefresh === false
      ? theme.dim(`  ${t('monitor.stop')}`)
      : theme.dim(`  ${t('monitor.stop')}   •   ${t('monitor.interval', { ms: options.interval ?? 2000 })}`);
  return `${monitorBox(data)}\n${footer}`;
}

export async function runMonitor(options = {}) {
  const interval = options.interval ?? loadConfig().monitorInterval ?? 2000;

  if (options.json || options.once) {
    const data = await collectMonitorData();
    if (options.json) {
      printJson({
        cpu: data.cpu,
        memory: data.memory,
        disk: data.disk,
        load: data.load,
        processes: data.processes.map((proc) => ({
          id: proc.id,
          name: proc.name,
          status: proc.status,
          cpu: proc.cpu,
          memory: proc.memory,
          uptime: proc.uptime,
          pid: proc.pid,
        })),
      });
    } else {
      process.stdout.write(`${renderMonitorFrame(data, { ...options, autoRefresh: false })}\n`);
    }
    return data;
  }

  let running = true;
  const stdin = process.stdin;
  const isTTY = stdin.isTTY;

  const stop = () => {
    running = false;
  };

  const onData = (chunk) => {
    const key = chunk.toString();
    if (key === '\u0003' || key.toLowerCase() === 'q') stop();
  };

  if (isTTY) {
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.on('data', onData);
  }

  const onSigint = () => stop();
  process.on('SIGINT', onSigint);

  try {
    const history = [];
    while (running) {
      const data = await collectMonitorData();
      history.push(data.cpu);
      if (history.length > 40) history.shift();
      data.history = [...history];
      if (options.clear !== false) process.stdout.write('\u001b[2J\u001b[H');
      process.stdout.write(`${renderMonitorFrame(data, { ...options, interval })}\n`);
      const waited = await waitWithStop(interval, () => running);
      if (!waited) break;
    }
  } finally {
    if (isTTY) {
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.off('data', onData);
    }
    process.off('SIGINT', onSigint);
  }
  return { stopped: true };
}

function waitWithStop(ms, isRunning) {
  return new Promise((resolve) => {
    const step = 100;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += step;
      if (!isRunning() || elapsed >= ms) {
        clearInterval(timer);
        resolve(isRunning());
      }
    }, step);
  });
}

export default runMonitor;
