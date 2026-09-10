import { listProcesses } from '../../pm2/processes.js';
import {
  isPm2Installed,
  isDaemonRunning,
  getPm2Version,
} from '../../pm2/daemon.js';
import { getNpmVersion } from '../../system/info.js';
import {
  getPm2Home,
  getPm2DumpPath,
  getPm2LogsDir,
  getMindPM2Home,
  fileExists,
  isWritable,
} from '../../utils/paths.js';
import { getCurrentUser, isRoot, canAccess, canRead, canWrite } from '../../security/permissions.js';
import { getCpuInfo } from '../../system/cpu.js';
import { getMemoryInfo } from '../../system/memory.js';
import { getDiskInfo } from '../../system/disk.js';
import { getOsInfo } from '../../system/os.js';
import { theme } from '../../ui/colors.js';
import { panel } from '../../ui/boxes.js';
import { printJson } from '../output.js';

async function runChecks() {
  const checks = [];
  const add = (name, status, message, fix) => checks.push({ name, status, message, fix });

  const run = async (name, fn) => {
    try {
      const outcome = await fn();
      if (outcome && typeof outcome === 'object') {
        add(name, outcome.status ?? (outcome.ok ? 'ok' : 'error'), outcome.message ?? '', outcome.fix);
      } else if (outcome === true || outcome === undefined) {
        add(name, 'ok', '');
      } else {
        add(name, 'warn', String(outcome));
      }
    } catch (error) {
      add(name, 'error', error?.message ?? String(error), error?.hint);
    }
  };

  add('Node.js installed', 'ok', process.version);

  await run('NPM installed', async () => {
    const npm = await getNpmVersion();
    return npm ? { ok: true, message: `v${npm}` } : { ok: false, status: 'error', message: 'npm niet gevonden' };
  });

  let pm2Version = null;
  const pm2Ok = await isPm2Installed();
  add('PM2 installed', pm2Ok ? 'ok' : 'error', pm2Ok ? '' : 'PM2 niet gevonden in PATH', pm2Ok ? null : 'npm install -g pm2');

  if (pm2Ok) {
    try {
      pm2Version = await getPm2Version();
      add('PM2 version', 'ok', `v${pm2Version}`);
    } catch (error) {
      add('PM2 version', 'warn', error.message);
    }

    const daemon = await isDaemonRunning();
    add(
      'PM2 daemon running',
      daemon ? 'ok' : 'warn',
      daemon ? '' : 'PM2 daemon reageert niet op ping',
      daemon ? null : 'pm2 ping\npm2 resurrect'
    );

    const home = getPm2Home();
    add('PM2 home directory', canAccess(home) ? 'ok' : 'warn', home, canAccess(home) ? null : 'Start PM2 een keer handmatig.');

    if (canAccess(home)) {
      add('PM2 home readable', canRead(home) ? 'ok' : 'error', '');
      add('PM2 home writable', canWrite(home) ? 'ok' : 'error', '');
    }

    const dump = getPm2DumpPath();
    add(
      'PM2 dump file',
      fileExists(dump) ? 'ok' : 'warn',
      fileExists(dump) ? '' : 'Nog geen dump opgeslagen',
      fileExists(dump) ? null : 'mindpm2 save'
    );

    const logsDir = getPm2LogsDir();
    add('Log directory', canAccess(logsDir) ? 'ok' : 'warn', logsDir);

    try {
      const processes = await listProcesses();
      add('Process list', 'ok', `${processes.length} processen`);
    } catch (error) {
      add('Process list', 'error', error.message, 'mindpm2 list');
    }
  }

  const user = getCurrentUser();
  add('Current user', 'ok', `${user}${isRoot() ? ' (root)' : ''}`);

  const mindHome = getMindPM2Home();
  add('MindPM2 home', canAccess(mindHome) || isWritable(mindHome) ? 'ok' : 'warn', mindHome);

  try {
    const cpu = getCpuInfo();
    add('CPU', 'ok', `${cpu.cores} cores`);
  } catch (error) {
    add('CPU', 'warn', error.message);
  }

  try {
    const mem = getMemoryInfo();
    add('Memory', 'ok', `${mem.usedFormatted} / ${mem.totalFormatted}`);
  } catch (error) {
    add('Memory', 'warn', error.message);
  }

  try {
    const disk = await getDiskInfo();
    add('Disk', disk ? 'ok' : 'warn', disk ? `${disk.usedFormatted} / ${disk.totalFormatted}` : 'onbekend');
  } catch (error) {
    add('Disk', 'warn', error.message);
  }

  const os = getOsInfo();
  add('Operating system', 'ok', `${os.distro} (${os.arch})`);

  return checks;
}

function iconFor(status) {
  if (status === 'ok') return theme.success('✔');
  if (status === 'warn') return theme.warning('⚠');
  return theme.error('✖');
}

export async function runDoctor(options = {}) {
  const checks = await runChecks();
  const passed = checks.filter((check) => check.status === 'ok').length;
  const warnings = checks.filter((check) => check.status === 'warn').length;
  const errors = checks.filter((check) => check.status === 'error').length;

  if (options.json) {
    printJson({ checks, passed, warnings, errors, healthy: errors === 0 });
    return { checks, passed, warnings, errors };
  }

  process.stdout.write(`${theme.primaryBold('MindPM2 Doctor')}\n\n`);
  for (const check of checks) {
    const suffix = check.message ? ` ${theme.muted(`- ${check.message}`)}` : '';
    process.stdout.write(`  ${iconFor(check.status)} ${check.name}${suffix}\n`);
  }

  const summary = [
    `${theme.muted('Checks:'.padEnd(12))}${checks.length}`,
    `${theme.muted('Passed:'.padEnd(12))}${theme.success(String(passed))}`,
    `${theme.muted('Warnings:'.padEnd(12))}${theme.warning(String(warnings))}`,
    `${theme.muted('Errors:'.padEnd(12))}${theme.error(String(errors))}`,
    '',
    errors === 0 ? theme.success('System looks healthy.') : theme.error('Er zijn problemen gevonden.'),
  ];

  process.stdout.write(`\n${panel('Result', summary.join('\n'))}\n`);

  if (errors > 0) {
    for (const check of checks.filter((item) => item.status === 'error')) {
      process.stdout.write(`\n${theme.error.bold(check.name)}\n`);
      if (check.message) process.stdout.write(`  ${check.message}\n`);
      if (check.fix) process.stdout.write(`\n  ${theme.muted('Suggested fix:')}\n\n    ${check.fix}\n`);
    }
  }

  return { checks, passed, warnings, errors };
}

export default runDoctor;
