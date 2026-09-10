import { listProcesses } from '../../pm2/processes.js';
import { isPm2Installed, isDaemonRunning, getPm2Version } from '../../pm2/daemon.js';
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
import { section } from '../../ui/screen.js';
import { printJson } from '../output.js';
import { t } from '../../i18n/index.js';

const GROUP_ORDER = ['environment', 'pm2', 'permissions', 'system'];
const GROUP_KEY = {
  environment: 'doctor.group.environment',
  pm2: 'doctor.group.pm2',
  permissions: 'doctor.group.permissions',
  system: 'doctor.group.system',
};

async function runChecks() {
  const checks = [];
  const add = (group, name, status, message, fix) =>
    checks.push({ group, name, status, message, fix });

  add('environment', t('doctor.check.node'), 'ok', process.version);

  try {
    const npm = await getNpmVersion();
    add(
      'environment',
      t('doctor.check.npm'),
      npm ? 'ok' : 'error',
      npm ? `v${npm}` : t('doctor.check.npmMissing')
    );
  } catch (error) {
    add('environment', t('doctor.check.npm'), 'error', error.message);
  }

  let pm2Version = null;
  const pm2Ok = await isPm2Installed();
  add(
    'environment',
    t('doctor.check.pm2Installed'),
    pm2Ok ? 'ok' : 'error',
    pm2Ok ? '' : t('error.pm2NotFound'),
    pm2Ok ? null : 'npm install -g pm2'
  );

  if (pm2Ok) {
    try {
      pm2Version = await getPm2Version();
      add('environment', t('doctor.check.pm2Version'), 'ok', `v${pm2Version}`);
    } catch (error) {
      add('environment', t('doctor.check.pm2Version'), 'warn', error.message);
    }

    const daemon = await isDaemonRunning();
    add(
      'pm2',
      t('doctor.check.daemon'),
      daemon ? 'ok' : 'warn',
      daemon ? '' : t('doctor.check.daemonFix'),
      daemon ? null : 'pm2 ping\npm2 resurrect'
    );

    const home = getPm2Home();
    add(
      'pm2',
      t('doctor.check.home'),
      canAccess(home) ? 'ok' : 'warn',
      home,
      canAccess(home) ? null : t('doctor.check.homeFix')
    );

    if (canAccess(home)) {
      add('pm2', t('doctor.check.homeReadable'), canRead(home) ? 'ok' : 'error', '');
      add('pm2', t('doctor.check.homeWritable'), canWrite(home) ? 'ok' : 'error', '');
    }

    const dump = getPm2DumpPath();
    add(
      'pm2',
      t('doctor.check.dump'),
      fileExists(dump) ? 'ok' : 'warn',
      fileExists(dump) ? '' : t('doctor.check.dumpMissing'),
      fileExists(dump) ? null : 'mindpm2 save'
    );

    add('pm2', t('doctor.check.logs'), canAccess(getPm2LogsDir()) ? 'ok' : 'warn', getPm2LogsDir());

    try {
      const processes = await listProcesses();
      add('pm2', t('doctor.check.processList'), 'ok', t('doctor.check.processCount', { count: processes.length }));
    } catch (error) {
      add('pm2', t('doctor.check.processList'), 'error', error.message, 'mindpm2 list');
    }
  }

  const user = getCurrentUser();
  add('permissions', t('doctor.check.user'), 'ok', `${user}${isRoot() ? ' (root)' : ''}`);

  const mindHome = getMindPM2Home();
  add(
    'permissions',
    t('doctor.check.mindHome'),
    canAccess(mindHome) || isWritable(mindHome) ? 'ok' : 'warn',
    mindHome
  );

  try {
    const cpu = getCpuInfo();
    add('system', t('doctor.check.cpu'), 'ok', t('doctor.check.cpuCores', { count: cpu.cores }));
  } catch (error) {
    add('system', t('doctor.check.cpu'), 'warn', error.message);
  }

  try {
    const mem = getMemoryInfo();
    add('system', t('doctor.check.memory'), 'ok', `${mem.usedFormatted} / ${mem.totalFormatted}`);
  } catch (error) {
    add('system', t('doctor.check.memory'), 'warn', error.message);
  }

  try {
    const disk = await getDiskInfo();
    add(
      'system',
      t('doctor.check.disk'),
      disk ? 'ok' : 'warn',
      disk ? `${disk.usedFormatted} / ${disk.totalFormatted}` : t('common.unknown')
    );
  } catch (error) {
    add('system', t('doctor.check.disk'), 'warn', error.message);
  }

  const os = getOsInfo();
  add('system', t('doctor.check.os'), 'ok', `${os.distro} (${os.arch})`);

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

  process.stdout.write(`${theme.primaryBold(t('doctor.title'))}\n`);

  for (const group of GROUP_ORDER) {
    const groupChecks = checks.filter((check) => check.group === group);
    if (groupChecks.length === 0) continue;
    process.stdout.write(`${section(t(GROUP_KEY[group]))}\n`);
    for (const check of groupChecks) {
      const suffix = check.message ? ` ${theme.muted(`- ${check.message}`)}` : '';
      process.stdout.write(`  ${iconFor(check.status)} ${check.name}${suffix}\n`);
    }
  }

  const summary = [
    `${theme.muted(t('doctor.checks').padEnd(14))}${checks.length}`,
    `${theme.muted(t('doctor.passed').padEnd(14))}${theme.success(String(passed))}`,
    `${theme.muted(t('doctor.warnings').padEnd(14))}${theme.warning(String(warnings))}`,
    `${theme.muted(t('doctor.errors').padEnd(14))}${theme.error(String(errors))}`,
    '',
    errors === 0 ? theme.success(t('doctor.healthy')) : theme.error(t('doctor.problems')),
  ];

  process.stdout.write(`\n${panel(t('doctor.result'), summary.join('\n'))}\n`);

  if (errors > 0) {
    for (const check of checks.filter((item) => item.status === 'error')) {
      process.stdout.write(`\n${theme.error.bold(check.name)}\n`);
      if (check.message) process.stdout.write(`  ${check.message}\n`);
      if (check.fix) {
        process.stdout.write(`\n  ${theme.muted(t('doctor.suggestedFix'))}\n\n    ${check.fix}\n`);
      }
    }
  }

  return { checks, passed, warnings, errors };
}

export default runDoctor;
