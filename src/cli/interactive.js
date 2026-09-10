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
import { t, resetLocale, SUPPORTED_LOCALES } from '../i18n/index.js';
import { THEME_NAMES } from '../ui/themes.js';

function clearScreen() {
  if (process.stdout.isTTY) process.stdout.write('\u001b[2J\u001b[H');
}

async function waitForEnter(message = t('common.pressEnter')) {
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

function stepLabel(current, total) {
  process.stdout.write(`${theme.dim(t('start.step', { current, total }))}\n\n`);
}

export async function runInteractive(options = {}) {
  const installed = await isPm2Installed();

  if (!installed) {
    clearScreen();
    showLogo();
    process.stdout.write(
      `\n${panel(
        undefined,
        `${theme.error.bold(`✖ ${t('error.pm2NotFound')}`)}\n\n` +
          `${t('error.pm2Required')}\n\n${t('error.pm2InstallHint')}`,
        { borderColor: 'red' }
      )}\n`
    );
    const action = await selectPrompt(t('menu.title'), [
      { name: t('menu.doctor'), value: 'doctor' },
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
      screenTitle(t('menu.title'));
    }
    const choice = await selectPrompt(t('menu.title'), mainMenuChoices(), { pageSize: 20 });

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
        screenTitle(t('screen.cleanup'));
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
        screenTitle(t('screen.update'));
        await guard(() => runUpdate(options));
        await waitForEnter();
        break;
      default:
        break;
    }
  }
  process.stdout.write(`\n${theme.muted(t('common.goodbye'))}\n`);
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

    screenTitle(t('screen.dashboard'));
    process.stdout.write(
      `${dashboardBox({
        pm2Version: pm2Version ? `v${pm2Version}` : t('info.notInstalled'),
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

    const action = await selectPrompt(t('screen.dashboard'), [
      { name: t('common.refresh'), value: 'refresh' },
      BACK_CHOICE,
    ]);
    if (isBack(action)) return;
    void options;
  }
}

async function processesScreen(options) {
  while (true) {
    clearScreen();
    const processes = await listProcesses().catch(() => []);
    const online = processes.filter((proc) => proc.status === 'online').length;
    screenTitle(
      t('screen.processes'),
      dotSeparator([
        `${processes.length} ${t('common.total')}`,
        theme.success(`${online} ${t('dashboard.online')}`),
        theme.dim(`${processes.length - online} ${t('common.other')}`),
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

    const selected = await selectPrompt(t('screen.selectProcess'), choices, { pageSize: 20 });
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
      `  ${theme.muted(t('details.cpu'))} ${theme.text(`${proc.cpu}%`)}   ` +
        `${theme.muted(t('details.memory'))} ${theme.text(formatBytes(proc.memory))}   ` +
        `${theme.muted(t('details.pid'))} ${theme.text(proc.pid || '-')}   ` +
        `${theme.muted(t('details.uptime'))} ${theme.text(formatDuration(proc.uptime))}\n`
    );

    if (proc.status === 'errored' || proc.restartTime >= 10) {
      process.stdout.write(
        `\n  ${theme.warning('⚠')} ${theme.warning(
          t('screen.stable.warning', { name: proc.name })
        )} ${theme.dim(`(${t('screen.restarts', { count: proc.restartTime })})`)}\n`
      );
    }
    process.stdout.write('\n');

    const choice = await selectPrompt(t('screen.actions'), processActionChoices(proc));

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
  process.stdout.write(
    `${panel(t('details.environment'), lines || theme.dim(t('common.noEnv')))}\n\n`
  );

  const reveal = await confirmPrompt(t('common.reveal'), { default: false });
  if (reveal === true) {
    clearScreen();
    const revealed = formatEnvEntries(proc.env, { reveal: true })
      .map(([key, value]) => `  ${theme.muted(`${key}=`)}${truncate(value, 64)}`)
      .join('\n');
    process.stdout.write(
      `${panel(
        t('details.environment'),
        `${theme.warning(t('common.secretShown'))}\n\n${revealed}`,
        { borderColor: 'yellow' }
      )}\n`
    );
    await waitForEnter();
  }
  void options;
}

async function openWorkingDirectory(cwd) {
  if (!cwd) {
    printWarning(t('error.noScript'));
    return;
  }
  const platform = getPlatformModule();
  const openCmd = platform?.getOpenCommand?.(cwd);
  if (!openCmd) {
    printInfo(`${t('details.directory')}: ${cwd}`);
    return;
  }
  try {
    const child = spawn(openCmd.command, openCmd.args, { detached: true, stdio: 'ignore' });
    child.unref();
    printSuccess(`${t('action.openDir')}: ${cwd}`);
  } catch {
    printInfo(`${t('details.directory')}: ${cwd}`);
  }
}

async function startWizard(options) {
  const TOTAL_STEPS = 4;
  clearScreen();
  screenTitle(t('screen.start'));
  stepLabel(1, TOTAL_STEPS);

  const type = await selectPrompt(t('start.type'), [
    { name: t('start.type.javascript'), value: 'javascript' },
    { name: t('start.type.npm'), value: 'npm' },
    { name: t('start.type.ecosystem'), value: 'ecosystem' },
    { name: t('start.type.existing'), value: 'existing' },
    { name: t('start.type.command'), value: 'command' },
    BACK_CHOICE,
  ]);
  if (isBack(type)) return;

  const startOptions = { ...options, yes: options.yes };

  if (type === 'ecosystem') {
    const file = await inputPrompt(t('start.ecosystemFile'), { default: 'ecosystem.config.cjs' });
    if (isBack(file)) return;
    await guard(async () => {
      const { start } = await import('../pm2/ecosystem.js');
      await start(file);
      printSuccess(t('start.ecosystemStarted'));
    });
    await waitForEnter();
    return;
  }

  if (type === 'existing') {
    const processes = await listProcesses().catch(() => []);
    if (processes.length === 0) {
      printWarning(t('start.noExisting'));
      await waitForEnter();
      return;
    }
    const name = await selectPrompt(
      t('screen.selectProcess'),
      processes.map((proc) => ({ name: proc.name, value: proc.name })).concat([BACK_CHOICE])
    );
    if (isBack(name)) return;
    await guard(async () => {
      await runStart(name, { ...startOptions, existing: true });
    });
    await waitForEnter();
    return;
  }

  stepLabel(2, TOTAL_STEPS);
  let target;
  if (type === 'javascript') {
    target = await inputPrompt(t('start.path'), { default: 'index.js' });
  } else if (type === 'npm') {
    target = await inputPrompt(t('start.npmDir'), { default: process.cwd() });
  } else {
    target = await inputPrompt(t('start.command'), { default: '' });
  }
  if (isBack(target)) return;

  stepLabel(3, TOTAL_STEPS);
  const name = await inputPrompt(t('start.name'), { default: '' });
  if (isBack(name)) return;

  const instances = await inputPrompt(t('start.instances'), { default: '1' });
  if (isBack(instances)) return;

  const mode = await selectPrompt(t('start.mode'), [
    { name: 'fork', value: 'fork' },
    { name: 'cluster', value: 'cluster' },
  ]);
  if (isBack(mode)) return;

  const watch = await confirmPrompt(t('start.watch'), { default: false });
  if (isBack(watch)) return;

  const maxMemory = await inputPrompt(t('start.maxMemory'), { default: '' });
  if (isBack(maxMemory)) return;

  stepLabel(4, TOTAL_STEPS);
  const envInput = await inputPrompt(t('start.env'), { default: '' });
  if (isBack(envInput)) return;

  const args = await inputPrompt(t('start.args'), { default: '' });
  if (isBack(args)) return;

  const envList = envInput
    ? envInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const rows = [
    [t('start.type'), type],
    ['Target', target],
    [t('start.name'), name || theme.dim(t('start.auto'))],
    [t('start.instances'), instances],
    [t('start.mode'), mode],
    [t('start.watch'), watch ? theme.success(t('details.enabled')) : theme.dim(t('details.disabled'))],
    [t('start.maxMemory'), maxMemory || theme.dim('-')],
    [t('start.args'), args || theme.dim('-')],
  ];

  process.stdout.write('\n');
  process.stdout.write(
    `${panel(
      t('start.summary'),
      rows.map(([key, value]) => `  ${theme.muted(String(key).padEnd(18))}${value}`).join('\n')
    )}\n`
  );

  const confirmed = await confirmPrompt(t('start.confirm'), { default: true });
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
    screenTitle(t('screen.logs'));
    const choice = await selectPrompt(t('screen.logs'), logsMenuChoices());
    if (isBack(choice)) return;

    if (choice === 'process') {
      const processes = await listProcesses().catch(() => []);
      if (processes.length === 0) {
        printWarning(t('list.empty'));
        await waitForEnter();
        continue;
      }
      const name = await selectPrompt(
        t('screen.selectProcess'),
        processes.map((proc) => ({ name: proc.name, value: proc.name })).concat([BACK_CHOICE])
      );
      if (isBack(name)) continue;
      clearScreen();
      screenTitle(t('screen.logs'), name);
      await guard(() => runLogs(name, { lines: 50 }));
      await waitForEnter();
      continue;
    }

    if (choice === 'live') {
      const processes = await listProcesses().catch(() => []);
      const name = await selectPrompt(
        t('logs.liveOf'),
        [{ name: t('logs.all'), value: null }]
          .concat(processes.map((proc) => ({ name: proc.name, value: proc.name })))
          .concat([BACK_CHOICE])
      );
      if (isBack(name)) continue;
      clearScreen();
      printInfo(t('logs.liveStarted'));
      await guard(() => runLogs(name, { live: true, lines: 15 }));
      continue;
    }

    clearScreen();
    screenTitle(t('screen.logs'));
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
    screenTitle(t('screen.save'));
    const choice = await selectPrompt(t('screen.save'), saveRestoreChoices());
    if (isBack(choice)) return;

    if (choice === 'show') {
      const dump = getPm2DumpPath();
      if (!fileExists(dump)) {
        printWarning(t('restore.noSaved'));
      } else {
        try {
          const fs = await import('node:fs');
          const data = JSON.parse(fs.readFileSync(dump, 'utf8'));
          const apps = (data.apps ?? []).map((app) => `  ${theme.muted('•')} ${app.name ?? t('common.unknown')}`);
          process.stdout.write(
            `${panel(
              t('save.menu.show'),
              `${theme.dim(t('restore.dumpFile', { path: dump }))}\n\n${t('restore.savedApps')}\n${apps.join('\n')}`
            )}\n`
          );
        } catch {
          printWarning(t('restore.cantRead'));
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
    screenTitle(t('screen.startup'));
    const choice = await selectPrompt(t('screen.startup'), startupChoices());
    if (isBack(choice)) return;

    if (choice === 'service') {
      const running = await isDaemonRunning();
      process.stdout.write(
        `${panel(
          t('startup.menu.service'),
          `  ${theme.muted(t('info.pm2'))}  ${
            running ? theme.success(t('startup.running')) : theme.warning(t('startup.notRunning'))
          }`
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
    screenTitle(t('screen.ecosystem'));
    const choice = await selectPrompt(t('screen.ecosystem'), ecosystemChoices());
    if (isBack(choice)) return;

    await guard(async () => {
      if (choice === 'create') {
        const name = await inputPrompt(t('eco.filename'), { default: 'ecosystem.config.cjs' });
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
    screenTitle(t('screen.server'));
    await guard(() => runInfo(options));
    const action = await selectPrompt(t('screen.server'), [
      { name: t('common.refresh'), value: 'refresh' },
      BACK_CHOICE,
    ]);
    if (isBack(action)) return;
  }
}

async function settingsScreen(options) {
  while (true) {
    clearScreen();
    screenTitle(t('screen.settings'));
    const choice = await selectPrompt(t('screen.settings'), settingsChoices());
    if (isBack(choice)) return;

    if (choice === 'show') {
      clearScreen();
      screenTitle(t('screen.settings'), t('config.title'));
      await runConfig('show');
      await waitForEnter();
      continue;
    }

    if (choice === 'theme') {
      const themeChoice = await selectPrompt(
        t('settings.changeTheme'),
        THEME_NAMES.map((name) => ({ name, value: name })).concat([BACK_CHOICE])
      );
      if (isBack(themeChoice)) continue;
      await guard(() => runConfig('set', 'theme', themeChoice));
      printInfo(t('settings.themeSet', { theme: themeChoice }));
      await waitForEnter();
      continue;
    }

    if (choice === 'language') {
      const languageChoice = await selectPrompt(
        t('settings.changeLanguage'),
        SUPPORTED_LOCALES.map((name) => ({ name, value: name })).concat([BACK_CHOICE])
      );
      if (isBack(languageChoice)) continue;
      await guard(() => runConfig('set', 'language', languageChoice));
      resetLocale();
      printInfo(t('settings.languageSet', { language: languageChoice }));
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
  screenTitle(t('screen.doctor'));
  await guard(() => runDoctor(options));
  await waitForEnter();
}

export { BACK };
