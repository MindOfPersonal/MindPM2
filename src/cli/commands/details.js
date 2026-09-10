import { findProcess } from '../../pm2/processes.js';
import { formatBytes } from '../../system/memory.js';
import { formatDuration, keyValue, truncate } from '../../ui/tables.js';
import { statusBadge, theme } from '../../ui/colors.js';
import { panel } from '../../ui/boxes.js';
import { formatEnvEntries } from '../../security/sanitizer.js';
import { printJson } from '../output.js';

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
    ['ID', proc.id],
    ['Status', statusBadge(proc.status)],
    ['PID', proc.pid || '-'],
    ['Mode', proc.mode],
    ['Instances', proc.instances],
    ['Node', proc.nodeVersion ?? '-'],
    ['', ''],
    ['CPU', `${proc.cpu}%`],
    ['Memory', formatBytes(proc.memory)],
    ['', ''],
    ['Restarts', proc.restartTime],
    ['Unstable', proc.unstableRestarts],
    ['', ''],
    ['Script', proc.script ?? '-'],
    ['Directory', proc.cwd ?? '-'],
    ['Interpreter', proc.interpreter ?? '-'],
    ['Watch', proc.watch ? 'enabled' : 'disabled'],
    ['Max memory', proc.maxMemoryRestart ?? '-'],
    ['', ''],
    ['Created', formatTimestamp(proc.createdAt)],
    ['Uptime', formatDuration(proc.uptime)],
  ];

  process.stdout.write(`${panel(proc.name, keyValue(rows))}\n`);

  if (envEntries.length > 0) {
    const envLines = envEntries
      .map(([key, value]) => `  ${theme.muted(`${key}=`)}${truncate(value, 64)}`)
      .join('\n');
    process.stdout.write(
      `\n${panel('Environment', `${theme.dim('Gevoelige waarden zijn gemaskeerd')}\n\n${envLines}`)}\n`
    );
  }

  return { ...proc, env };
}

export default runDetails;
