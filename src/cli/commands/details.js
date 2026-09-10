import { findProcess } from '../../pm2/processes.js';
import { formatBytes } from '../../system/memory.js';
import { formatDuration, keyValue, truncate } from '../../ui/tables.js';
import { statusBadge, theme } from '../../ui/colors.js';
import { panel } from '../../ui/boxes.js';
import { formatEnvEntries } from '../../security/sanitizer.js';
import { printJson } from '../output.js';
import { t } from '../../i18n/index.js';

export function formatTimestamp(ms) {
  if (!ms) return '-';
  return new Date(Number(ms)).toISOString().replace('T', ' ').slice(0, 19);
}

export async function runDetails(target, options = {}) {
  const proc = await findProcess(target);
  const envEntries = formatEnvEntries(proc.env, { reveal: options.reveal });
  const env = Object.fromEntries(envEntries);

  if (options.json) {
    printJson({ ...proc, raw: undefined, env });
    return { ...proc, env };
  }

  const rows = [
    [t('details.id'), proc.id],
    [t('details.status'), statusBadge(proc.status)],
    [t('details.pid'), proc.pid || '-'],
    [t('details.mode'), proc.mode],
    [t('details.instances'), proc.instances],
    [t('details.node'), proc.nodeVersion ?? '-'],
    ['', ''],
    [t('details.cpu'), `${proc.cpu}%`],
    [t('details.memory'), formatBytes(proc.memory)],
    ['', ''],
    [t('details.restarts'), proc.restartTime],
    [t('details.unstable'), proc.unstableRestarts],
    ['', ''],
    [t('details.script'), proc.script ?? '-'],
    [t('details.directory'), proc.cwd ?? '-'],
    [t('details.interpreter'), proc.interpreter ?? '-'],
    [t('details.watch'), proc.watch ? t('details.enabled') : t('details.disabled')],
    [t('details.maxMemory'), proc.maxMemoryRestart ?? '-'],
    ['', ''],
    [t('details.created'), formatTimestamp(proc.createdAt)],
    [t('details.uptime'), formatDuration(proc.uptime)],
  ];

  process.stdout.write(`${panel(proc.name, keyValue(rows))}\n`);

  if (envEntries.length > 0) {
    const envLines = envEntries
      .map(([key, value]) => `  ${theme.muted(`${key}=`)}${truncate(value, 64)}`)
      .join('\n');
    process.stdout.write(
      `\n${panel(t('details.environment'), `${theme.dim(t('common.masked'))}\n\n${envLines}`)}\n`
    );
  }

  return { ...proc, env };
}

export default runDetails;
