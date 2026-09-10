import { getServerInfo } from '../../system/info.js';
import { printJson } from '../output.js';
import { theme } from '../../ui/colors.js';
import { panel } from '../../ui/boxes.js';
import { keyValue } from '../../ui/tables.js';

export async function runInfo(options = {}) {
  const info = await getServerInfo({ sampleMs: options.json ? 0 : 150 });

  if (options.json) {
    printJson(info);
    return info;
  }

  const envRows = [
    ['Hostname', info.hostname],
    ['OS', info.os],
    ['Architecture', info.arch],
    ['Kernel', info.kernel],
    ['User', info.user],
  ];
  const runtimeRows = [
    ['Node', info.node],
    ['NPM', info.npm ?? theme.dim('unknown')],
    ['PM2', info.pm2Formatted ?? theme.warning('not installed')],
  ];
  const systemRows = [
    ['CPU', info.cpuModel],
    ['Cores', String(info.cpuCores)],
    ['CPU usage', `${info.cpu.usage}%`],
    ['Memory', `${info.memory.usedFormatted} / ${info.memory.totalFormatted}`],
    [
      'Disk',
      info.disk
        ? `${info.disk.usedFormatted} / ${info.disk.totalFormatted} (${info.disk.percent}%)`
        : theme.dim('unknown'),
    ],
    ['Uptime', info.hostUptimeFormatted],
  ];

  process.stdout.write(
    `${panel('Environment', keyValue(envRows))}\n\n` +
      `${panel('Runtime', keyValue(runtimeRows))}\n\n` +
      `${panel('System', keyValue(systemRows))}\n`
  );
  return info;
}

export default runInfo;
