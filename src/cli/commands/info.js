import { getServerInfo } from '../../system/info.js';
import { printJson } from '../output.js';
import { theme } from '../../ui/colors.js';
import { panel } from '../../ui/boxes.js';
import { keyValue } from '../../ui/tables.js';
import { t } from '../../i18n/index.js';

export async function runInfo(options = {}) {
  const info = await getServerInfo({ sampleMs: options.json ? 0 : 150 });

  if (options.json) {
    printJson(info);
    return info;
  }

  const envRows = [
    [t('info.hostname'), info.hostname],
    [t('info.os'), info.os],
    [t('info.architecture'), info.arch],
    [t('info.kernel'), info.kernel],
    [t('info.user'), info.user],
  ];
  const runtimeRows = [
    [t('info.node'), info.node],
    [t('info.npm'), info.npm ?? theme.dim(t('common.unknown'))],
    [t('info.pm2'), info.pm2Formatted ?? theme.warning(t('info.notInstalled'))],
  ];
  const systemRows = [
    [t('info.cpu'), info.cpuModel],
    [t('info.cores'), String(info.cpuCores)],
    [t('info.cpuUsage'), `${info.cpu.usage}%`],
    [t('info.memory'), `${info.memory.usedFormatted} / ${info.memory.totalFormatted}`],
    [
      t('info.disk'),
      info.disk
        ? `${info.disk.usedFormatted} / ${info.disk.totalFormatted} (${info.disk.percent}%)`
        : theme.dim(t('common.unknown')),
    ],
    [t('info.uptime'), info.hostUptimeFormatted],
  ];

  process.stdout.write(
    `${panel(t('info.environment'), keyValue(envRows))}\n\n` +
      `${panel(t('info.runtime'), keyValue(runtimeRows))}\n\n` +
      `${panel(t('info.system'), keyValue(systemRows))}\n`
  );
  return info;
}

export default runInfo;
