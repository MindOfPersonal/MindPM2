import readline from 'node:readline/promises';
import { spawn } from 'node:child_process';
import { showLogo } from '../ui/logo.js';
import { theme, statusBadge } from '../ui/colors.js';
import { dashboardBox, panel } from '../ui/boxes.js';
import { processTable, formatDuration, truncate } from '../ui/tables.js';
import { header, dotSeparator } from '../ui/screen.js';
import { selectPrompt, inputPrompt, confirmPrompt, BACK } from './prompts.js';
import {
  mainMenuChoices,
  processActionChoices,
  logsMenuChoices,
  saveRestoreChoices,
  startupChoices,
  ecosystemChoices,
  settingsChoices,
  BACK_CHOICE,
  EXIT_CHOICE,
} from './menus.js';
import { listProcesses, findProcess } from '../pm2/processes.js';
import { isPm2Installed, isDaemonRunning, getPm2Version } from '../pm2/daemon.js';
import { getServerInfo } from '../system/info.js';
import { formatBytes } from '../system/memory.js';
import { getPlatformModule } from '../system/platform/index.js';
import { getPm2DumpPath, fileExists } from '../utils/paths.js';
import { runDetails } from './commands/details.js';
import { runStart } from './commands/start.js';
import { runStop, runRestart, runReload, runDelete, runReset } from './commands/actions.js';
import { runLogs } from './commands/logs.js';
import { runSave } from './commands/save.js';
import { runResurrect } from './commands/resurrect.js';
import { runStartup } from './commands/startup.js';
import { runDoctor } from './commands/doctor.js';
import { runMonitor } from './commands/monitor.js';
import { runInfo } from './commands/info.js';
import { runEcosystem } from './commands/ecosystem.js';
import { runConfig } from './commands/config.js';
import { runUpdate } from './commands/update.js';
import { runCleanup } from './commands/cleanup.js';
import { printSuccess, printWarning, printInfo, printError } from './output.js';
import { formatEnvEntries } from '../security/sanitizer.js';

function clearScreen() {
  if (process.stdout.isTTY) process.stdout.write('\u001b[2J\u001b[H');
}

async function waitForEnter(message = 'Druk op Enter om verder te gaan...') {
  if (!process.stdin.isTTY) return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    await rl.question(theme.dim(message));
  } finally {
    rl.close();
  }
}

function isBack(value) {
  return value === BACK || value === 'back' || value === undefined;
}

async function guard(fn) {
  try {
    await fn();
  } catch (error) {
    printError(error.message ?? String(error));
    if (error.hint) printInfo(error.hint);
  }
}

function screenTitle(title, subtitle) {
  process.stdout.write(`${header(title, subtitle)}\n\n`);
}

export async function runInteractive(options = {}) {
  const installed = await isPm2Installed();

  if (!installed) {
    clearScreen();
    showLogo();
    process.stdout.write(
      `\n${panel(
        undefined,
        `${theme.error.bold('✖ PM2 could not be found.')}\n\n` +
          `MindPM2 requires PM2 to be installed.\n\n` +
          `Install PM2 globally with:\n\n    ${theme.accent('npm install -g pm2')}\n\n` +
          `Then restart MindPM2.`,
        { borderColor: 'red' }
      )}\n`
    );
    const action = await selectPrompt('Wat wil je doen?', [
      { name: 'Open Doctor', value: 'doctor' },
      EXIT_CHOICE,
    ]);
    if (action === 'doctor') await doctorScreen(options);
    return;
  }

  let first = true;
  while (true) {
    clearScreen();
    if (first) {
      showLogo();
      first = false;
    } else {
      screenTitle('Main Menu');
    }
    const choice = await selectPrompt('Main Menu', mainMenuChoices(), { pageSize: 20 });

    if (isBack(choice) || choice === 'exit') break;

    switch (choice) {
      case 'dashboard':
        await dashboardScreen(options);
        break;
      case 'processes':
        await processesScreen(options);
        break;
      case 'start':
        await startWizard(options);
        break;
      case 'logs':
        await logsScreen(options);
        break;
      case 'monitor':
        clearScreen();
        await guard(() => runMonitor({ clear: true }));
        break;
      case 'startup':
        await startupScreen(options);
        break;
      case 'save':
        await saveRestoreScreen(options);
        break;
      case 'ecosystem':
        await ecosystemScreen(options);
        break;
      case 'server':
        await serverScreen(options);
        break;
      case 'cleanup':
        clearScreen();
        screenTitle('Cleanup');
        await guard(() => runCleanup(options));
        await waitForEnter();
        break;
      case 'settings':
        await settingsScreen(options);
        break;
      case 'doctor':
        await doctorScreen(options);
        break;
      case 'update':
        clearScreen();
        screenTitle('Update');
        await guard(() => runUpdate(options));
        await waitForEnter();
        break;
      default:
        break;
    }
  }
  process.stdout.write(`\n${theme.muted('Tot ziens!')}\n`);
}

async function dashboardScreen(options) {
  while (true) {
    clearScreen();
    const [processes, info, pm2Version] = await Promise.all([
      listProcesses().catch(() => []),
      getServerInfo({ sampleMs: 150 }),
      getPm2Version().catch(() => null),
    ]);

    const online = processes.filter((proc) => proc.status === 'online').length;
    const stopped = processes.filter((proc) =>
      ['stopped', 'stopped_gracefully'].includes(proc.status)
    ).length;
    const errored = processes.filter((proc) => proc.status === 'errored').length;

    screenTitle('Dashboard');
    process.stdout.write(
      `${dashboardBox({
        pm2Version: pm2Version ? `v${pm2Version}` : 'not installed',
        nodeVersion: process.version,
        platform: `${info.platformLabel} ${info.arch}`,
        hostname: info.hostname,
        processes: { online, stopped, errored, total: processes.length },
        system: {
          cpu: info.cpu.usage,
          memoryUsed: info.memory.usedFormatted,
          memoryTotal: info.memory.totalFormatted,
          memoryPercent: info.memory.percent,
          diskPercent: info.disk?.percent ?? null,
          diskSuffix: info.disk
            ? `${info.disk.usedFormatted} / ${info.disk.totalFormatted}`
            : '',
          uptime: info.hostUptimeFormatted,
        },
      })}\n`
    );

    const action = await selectPrompt('Dashboard', [
      { name: 'Refresh', value: 'refresh' },
      BACK_CHOICE,
    ]);
    if (isBack(action)) return;
  }
}

async function processesScreen(options) {
  while (true) {
    clearScreen();
    const processes = await listProcesses().catch(() => []);
    const online = processes.filter((proc) => proc.status === 'online').length;
    screenTitle(
      'Processes',
      dotSeparator([
        `${processes.length} total`,
        theme.success(`${online} online`),
        theme.dim(`${processes.length - online} other`),
      ])
    );
    process.stdout.write(`${processTable(processes)}\n\n`);

    if (processes.length === 0) {
      await waitForEnter();
      return;
    }

    const choices = processes.map((proc) => ({
      name: `${String(proc.id).padStart(2)}  ${proc.name}  ${theme.dim(`[${proc.status}]`)}`,
      value: proc.name,
    }));
    choices.push(BACK_CHOICE);

    const selected = await selectPrompt('Selecteer een proces', choices, { pageSize: 20 });
    if (isBack(selected)) return;

    await processActionsScreen(selected, options);
  }
}

async function processActionsScreen(identifier, options) {
  while (true) {
    clearScreen();
    let proc;
    try {
      proc = await findProcess(identifier);
    } catch (error) {
      printError(error.message);
      return;
    }

    screenTitle(proc.name, statusBadge(proc.status));
    process.stdout.write(
      `  ${theme.muted('CPU')} ${theme.text(`${proc.cpu}%`)}   ` +
        `${theme.muted('RAM')} ${theme.text(formatBytes(proc.memory))}   ` +
        `${theme.muted('PID')} ${theme.text(proc.pid || '-')}   ` +
        `${theme.muted('Uptime')} ${theme.text(formatDuration(proc.uptime))}\n`
    );

    if (proc.status === 'errored' || proc.restartTime >= 10) {
      process.stdout.write(`\n  ${theme.warning('⚠')} ${theme.warning(`${proc.name} lijkt onstabiel`)} ${theme.dim(`(${proc.restartTime} restarts)`)}\n`);
    }
    process.stdout.write('\n');

    const choice = await selectPrompt('Acties', processActionChoices(proc));

    if (isBack(choice)) return;

    await guard(async () => {
      switch (choice) {
        case 'details':
          clearScreen();
          await runDetails(proc.name, options);
          await waitForEnter();
          break;
        case 'environment':
          clearScreen();
          await showEnvironment(proc, options);
          break;
        case 'logs':
          clearScreen();
          await runLogs(proc.name, { lines: 50 });
          await waitForEnter();
          break;
        case 'start':
          await runStart(proc.name, { ...options, yes: true });
          await waitForEnter();
          break;
        case 'stop':
          await runStop(proc.name, options);
          await waitForEnter();
          break;
        case 'restart':
          await runRestart(proc.name, options);
          await waitForEnter();
          break;
        case 'reload':
          await runReload(proc.name, options);
          await waitForEnter();
          break;
        case 'reset':
          await runReset(proc.name, options);
          await waitForEnter();
          break;
        case 'delete':
          await runDelete(proc.name, options);
          await waitForEnter();
          identifier = null;
          break;
        case 'open-cwd':
          await openWorkingDirectory(proc.cwd);
          await waitForEnter();
          break;
        default:
          break;
      }
    });

    if (identifier === null) return;
  }
}

async function showEnvironment(proc, options) {
  const masked = formatEnvEntries(proc.env);
  const lines = masked
    .map(([key, value]) => `  ${theme.muted(`${key}=`)}${truncate(value, 64)}`)
    .join('\n');
  process.stdout.write(`${panel(`${proc.name} Environment`, lines || theme.dim('Geen environment variables.'))}\n\n`);

  const reveal = await confirmPrompt('Gevoelige waarden tonen?', { default: false });
  if (reveal === true) {
    clearScreen();
    const revealed = formatEnvEntries(proc.env, { reveal: true })
      .map(([key, value]) => `  ${theme.muted(`${key}=`)}${truncate(value, 64)}`)
      .join('\n');
    process.stdout.write(`${panel('Environment (revealed)', `${theme.warning('Gevoelige waarden worden getoond.')}\n\n${revealed}`, { borderColor: 'yellow' })}\n`);
    await waitForEnter();
  }
  void options;
}

async function openWorkingDirectory(cwd) {
  if (!cwd) {
    printWarning('Geen working directory bekend.');
    return;
  }
  const platform = getPlatformModule();
  const openCmd = platform?.getOpenCommand?.(cwd);
  if (!openCmd) {
    printInfo(`Working directory: ${cwd}`);
    return;
  }
  try {
    const child = spawn(openCmd.command, openCmd.args, { detached: true, stdio: 'ignore' });
    child.unref();
    printSuccess(`Map geopend: ${cwd}`);
  } catch {
    printInfo(`Working directory: ${cwd}`);
  }
}

async function startWizard(options) {
  clearScreen();
  screenTitle('Start Application');

  const type = await selectPrompt('Application type:', [
    { name: 'JavaScript file', value: 'javascript' },
    { name: 'NPM script', value: 'npm' },
    { name: 'Ecosystem file', value: 'ecosystem' },
    { name: 'Existing process', value: 'existing' },
    { name: 'Custom command', value: 'command' },
    BACK_CHOICE,
  ]);
  if (isBack(type)) return;

  const startOptions = { ...options, yes: options.yes };

  if (type === 'ecosystem') {
    const file = await inputPrompt('Ecosystem bestand:', { default: 'ecosystem.config.cjs' });
    if (isBack(file)) return;
    await guard(async () => {
      const { start } = await import('../pm2/ecosystem.js');
      await start(file);
      printSuccess('Ecosystem gestart.');
    });
    await waitForEnter();
    return;
  }

  if (type === 'existing') {
    const processes = await listProcesses().catch(() => []);
    if (processes.length === 0) {
      printWarning('Geen bestaande processen.');
      await waitForEnter();
      return;
    }
    const name = await selectPrompt(
      'Selecteer proces:',
      processes.map((proc) => ({ name: proc.name, value: proc.name })).concat([BACK_CHOICE])
    );
    if (isBack(name)) return;
    await guard(async () => {
      await runStart(name, { ...startOptions, existing: true });
    });
    await waitForEnter();
    return;
  }

  let target;
  if (type === 'javascript') {
    target = await inputPrompt('Path naar script:', { default: 'index.js' });
    if (isBack(target)) return;
  } else if (type === 'npm') {
    target = await inputPrompt('Pad naar package.json map:', { default: process.cwd() });
    if (isBack(target)) return;
  } else {
    target = await inputPrompt('Commando:', { default: '' });
    if (isBack(target)) return;
  }

  const name = await inputPrompt('Application name:', { default: '' });
  if (isBack(name)) return;

  const instances = await inputPrompt('Instances:', { default: '1' });
  if (isBack(instances)) return;

  const mode = await selectPrompt('Execution mode:', [
    { name: 'fork', value: 'fork' },
    { name: 'cluster', value: 'cluster' },
  ]);
  if (isBack(mode)) return;

  const watch = await confirmPrompt('Watch mode?', { default: false });
  if (isBack(watch)) return;

  const maxMemory = await inputPrompt('Max memory restart (leeg = geen):', { default: '' });
  if (isBack(maxMemory)) return;

  const envInput = await inputPrompt('Environment (KEY=VALUE, komma-gescheiden, leeg = geen):', {
    default: '',
  });
  if (isBack(envInput)) return;

  const args = await inputPrompt('Arguments (leeg = geen):', { default: '' });
  if (isBack(args)) return;

  const envList = envInput
    ? envInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const rows = [
    ['Type', type],
    ['Target', target],
    ['Name', name || theme.dim('(auto)')],
    ['Instances', instances],
    ['Mode', mode],
    ['Watch', watch ? theme.success('enabled') : theme.dim('disabled')],
    ['Max memory', maxMemory || theme.dim('-')],
    ['Arguments', args || theme.dim('-')],
  ];

  process.stdout.write('\n');
  process.stdout.write(
    `${panel(
      'Start Application',
      rows.map(([key, value]) => `  ${theme.muted(String(key).padEnd(12))}${value}`).join('\n')
    )}\n`
  );

  const confirmed = await confirmPrompt('Start application?', { default: true });
  if (confirmed !== true) return;

  await guard(async () => {
    await runStart(target, {
      ...startOptions,
      name: name || undefined,
      instances: instances || undefined,
      cluster: mode === 'cluster',
      fork: mode === 'fork',
      watch,
      maxMemory: maxMemory || undefined,
      env: envList,
      args: args || undefined,
      npm: type === 'npm',
      command: type === 'command',
    });
  });
  await waitForEnter();
}

async function logsScreen(options) {
  while (true) {
    clearScreen();
    screenTitle('Logs');
    const choice = await selectPrompt('Logs', logsMenuChoices());
    if (isBack(choice)) return;

    if (choice === 'process') {
      const processes = await listProcesses().catch(() => []);
      if (processes.length === 0) {
        printWarning('Geen processen.');
        await waitForEnter();
        continue;
      }
      const name = await selectPrompt(
        'Selecteer proces:',
        processes.map((proc) => ({ name: proc.name, value: proc.name })).concat([BACK_CHOICE])
      );
      if (isBack(name)) continue;
      clearScreen();
      screenTitle('Logs', name);
      await guard(() => runLogs(name, { lines: 50 }));
      await waitForEnter();
      continue;
    }

    if (choice === 'live') {
      const processes = await listProcesses().catch(() => []);
      const name = await selectPrompt(
        'Live logs van:',
        [{ name: 'All Processes', value: null }]
          .concat(processes.map((proc) => ({ name: proc.name, value: proc.name })))
          .concat([BACK_CHOICE])
      );
      if (isBack(name)) continue;
      clearScreen();
      printInfo('Live logs gestart. Druk op CTRL+C of Q om te stoppen.');
      await guard(() => runLogs(name, { live: true, lines: 15 }));
      continue;
    }

    clearScreen();
    screenTitle('Logs');
    await guard(async () => {
      switch (choice) {
        case 'all':
          await runLogs(undefined, { lines: 50 });
          break;
        case 'errors':
          await runLogs(undefined, { lines: 50, err: true });
          break;
        case 'output':
          await runLogs(undefined, { lines: 50, out: true });
          break;
        case 'clear':
          await runLogs(undefined, { clear: true });
          break;
        case 'files':
          await runLogs(undefined, { files: true });
          break;
        default:
          break;
      }
    });
    await waitForEnter();
    void options;
  }
}

async function saveRestoreScreen(options) {
  while (true) {
    clearScreen();
    screenTitle('Save / Restore');
    const choice = await selectPrompt('Save / Restore', saveRestoreChoices());
    if (isBack(choice)) return;

    if (choice === 'show') {
      const dump = getPm2DumpPath();
      if (!fileExists(dump)) {
        printWarning('Nog geen opgeslagen configuratie gevonden. Gebruik eerst "Save current processes".');
      } else {
        try {
          const fs = await import('node:fs');
          const data = JSON.parse(fs.readFileSync(dump, 'utf8'));
          const apps = (data.apps ?? []).map((app) => `  ${theme.muted('•')} ${app.name ?? 'unnamed'}`);
          process.stdout.write(
            `${panel('Saved configuration', `${theme.dim(dump)}\n\n${apps.join('\n')}`)}\n`
          );
        } catch {
          printWarning('Kon dump bestand niet lezen.');
        }
      }
      await waitForEnter();
      continue;
    }

    await guard(async () => {
      if (choice === 'save') await runSave(options);
      if (choice === 'restore') await runResurrect(options);
    });
    await waitForEnter();
  }
}

async function startupScreen(options) {
  while (true) {
    clearScreen();
    screenTitle('Startup');
    const choice = await selectPrompt('Startup', startupChoices());
    if (isBack(choice)) return;

    if (choice === 'service') {
      const running = await isDaemonRunning();
      process.stdout.write(
        `${panel(
          'Service Status',
          `  ${theme.muted('PM2 daemon')}  ${running ? theme.success('running') : theme.warning('not running')}`
        )}\n`
      );
      await waitForEnter();
      continue;
    }

    await guard(async () => {
      if (choice === 'generate') await runStartup({ ...options, default: true });
      if (choice === 'status') await runStartup({ ...options, status: true });
      if (choice === 'disable') await runStartup({ ...options, disable: true });
    });
    await waitForEnter();
  }
}

async function ecosystemScreen(options) {
  while (true) {
    clearScreen();
    screenTitle('Ecosystem');
    const choice = await selectPrompt('Ecosystem', ecosystemChoices());
    if (isBack(choice)) return;

    await guard(async () => {
      if (choice === 'create') {
        const name = await inputPrompt('Bestandsnaam:', { default: 'ecosystem.config.cjs' });
        if (isBack(name)) return;
        await runEcosystem('create', name, options);
        return;
      }
      await runEcosystem(choice, undefined, options);
    });
    await waitForEnter();
  }
}

async function serverScreen(options) {
  while (true) {
    clearScreen();
    screenTitle('Server Information');
    await guard(() => runInfo(options));
    const action = await selectPrompt('Server Information', [
      { name: 'Refresh', value: 'refresh' },
      BACK_CHOICE,
    ]);
    if (isBack(action)) return;
  }
}

async function settingsScreen(options) {
  while (true) {
    clearScreen();
    screenTitle('Settings');
    const choice = await selectPrompt('Settings', settingsChoices());
    if (isBack(choice)) return;

    if (choice === 'show') {
      clearScreen();
      screenTitle('Settings', 'Configuration');
      await runConfig('show');
      await waitForEnter();
      continue;
    }

    await guard(async () => {
      if (choice === 'edit') await runConfig('edit');
      if (choice === 'reset') await runConfig('reset', undefined, undefined, options);
    });
    await waitForEnter();
  }
}

async function doctorScreen(options) {
  clearScreen();
  screenTitle('Doctor');
  await guard(() => runDoctor(options));
  await waitForEnter();
}

export { BACK };
