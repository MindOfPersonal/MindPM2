import { Command } from 'commander';
import { runList } from './commands/list.js';
import { runStart } from './commands/start.js';
import { runStop } from './commands/actions.js';
import { runRestart } from './commands/actions.js';
import { runReload } from './commands/actions.js';
import { runDelete } from './commands/actions.js';
import { runReset } from './commands/actions.js';
import { runScale } from './commands/actions.js';
import { runLogs } from './commands/logs.js';
import { runSave } from './commands/save.js';
import { runResurrect } from './commands/resurrect.js';
import { runStartup } from './commands/startup.js';
import { runDoctor } from './commands/doctor.js';
import { runMonitor } from './commands/monitor.js';
import { runInfo } from './commands/info.js';
import { runDetails } from './commands/details.js';
import { runEcosystem } from './commands/ecosystem.js';
import { runConfig } from './commands/config.js';
import { runVersion } from './commands/version.js';
import { runUpdate } from './commands/update.js';
import { runCleanup } from './commands/cleanup.js';
import { handleError } from './output.js';
import { runInteractive } from './interactive.js';
import { ensurePm2Available } from '../pm2/daemon.js';
import { printJson } from './output.js';
import { theme } from '../ui/colors.js';

function collect(value, previous) {
  return previous.concat([value]);
}

function wrap(action) {
  return async (...args) => {
    const command = args[args.length - 1];
    const options = command?.optsWithGlobals ? command.optsWithGlobals() : {};
    const actionArgs = args.slice(0, -2);
    try {
      await action(...actionArgs, options);
    } catch (error) {
      process.exitCode = handleError(error, options);
    }
  };
}

async function requirePm2(options) {
  try {
    await ensurePm2Available();
  } catch (error) {
    if (options?.json) {
      printJson({ error: true, message: error.message, code: error.exitCode });
      process.exitCode = error.exitCode ?? 3;
      return false;
    }
    throw error;
  }
  return true;
}

export function buildProgram() {
  const program = new Command();

  program
    .name('mindpm2')
    .description('MindPM2 - A powerful interactive PM2 management CLI.')
    .usage('[command] [options]')
    .option('--debug', 'Enable debug mode')
    .option('--json', 'Output JSON')
    .option('--yes', 'Skip confirmations')
    .option('-V, --version', 'Show version')
    .showHelpAfterError('(run "mindpm2 --help" voor meer informatie)');

  program
    .command('list [target]')
    .alias('ls')
    .description('List PM2 processes')
    .option('--sort <field>', 'Sort by name, id, status, cpu, memory, uptime, restarts, pid')
    .option('--status <status>', 'Filter by status')
    .option('--json', 'Output JSON')
    .action(
      wrap(async (target, options) => {
        if (!(await requirePm2(options))) return;
        await runList(target, options);
      })
    );

  program
    .command('status [target]')
    .description('Show PM2 status')
    .option('--sort <field>')
    .option('--json')
    .action(
      wrap(async (target, options) => {
        if (!(await requirePm2(options))) return;
        await runList(target, options);
      })
    );

  program
    .command('start [target]')
    .alias('restart-app')
    .description('Start an application, process or ecosystem file')
    .option('-n, --name <name>', 'Application name')
    .option('-i, --instances <number>', 'Number of instances')
    .option('--cluster', 'Cluster mode')
    .option('--fork', 'Fork mode')
    .option('--watch', 'Enable watch mode')
    .option('--max-memory <size>', 'Max memory restart, e.g. 500M')
    .option('--cwd <path>', 'Working directory')
    .option('--interpreter <bin>', 'Interpreter')
    .option('--env <KEY=VALUE>', 'Environment variable (repeatable)', collect, [])
    .option('--args <args>', 'Script arguments')
    .option('--npm', 'Start an NPM script')
    .option('--npm-script <script>', 'NPM script name', 'start')
    .option('--command', 'Treat target as a custom command')
    .action(
      wrap(async (target, options) => {
        if (!(await requirePm2(options))) return;
        await runStart(target, options);
      })
    );

  program
    .command('stop <target>')
    .description('Stop a process')
    .action(
      wrap(async (target, options) => {
        if (!(await requirePm2(options))) return;
        await runStop(target, options);
      })
    );

  program
    .command('restart <target>')
    .description('Restart a process')
    .action(
      wrap(async (target, options) => {
        if (!(await requirePm2(options))) return;
        await runRestart(target, options);
      })
    );

  program
    .command('reload <target>')
    .description('Reload a process')
    .action(
      wrap(async (target, options) => {
        if (!(await requirePm2(options))) return;
        await runReload(target, options);
      })
    );

  program
    .command('delete <target>')
    .alias('del')
    .description('Delete a process')
    .action(
      wrap(async (target, options) => {
        if (!(await requirePm2(options))) return;
        await runDelete(target, options);
      })
    );

  program
    .command('reset <target>')
    .description('Reset restart/uptime counters of a process')
    .action(
      wrap(async (target, options) => {
        if (!(await requirePm2(options))) return;
        await runReset(target, options);
      })
    );

  program
    .command('scale <target> <instances>')
    .description('Scale a process to a number of instances')
    .action(
      wrap(async (target, instances, options) => {
        if (!(await requirePm2(options))) return;
        await runScale(target, instances, options);
      })
    );

  program
    .command('logs [target]')
    .description('Show PM2 logs')
    .option('-l, --lines <number>', 'Number of lines', (value) => Number(value))
    .option('--err', 'Only error logs')
    .option('--out', 'Only output logs')
    .option('-f, --live', 'Stream live logs')
    .option('--follow', 'Stream live logs (alias)')
    .option('--clear', 'Clear logs')
    .option('--reload', 'Reload logs')
    .option('--files', 'List log files')
    .option('--json')
    .action(
      wrap(async (target, options) => {
        if (options.follow) options.live = true;
        if (!(await requirePm2(options))) return;
        await runLogs(target, options);
      })
    );

  program
    .command('save')
    .description('Save the current PM2 process list')
    .action(
      wrap(async (options) => {
        if (!(await requirePm2(options))) return;
        await runSave(options);
      })
    );

  program
    .command('resurrect')
    .alias('restore')
    .description('Restore the saved PM2 process list')
    .action(
      wrap(async (options) => {
        if (!(await requirePm2(options))) return;
        await runResurrect(options);
      })
    );

  program
    .command('startup')
    .description('Manage PM2 startup configuration')
    .option('--status', 'Show startup status')
    .option('--disable', 'Disable startup')
    .option('--json')
    .action(
      wrap(async (options) => {
        if (!(await requirePm2(options))) return;
        await runStartup(options);
      })
    );

  program
    .command('doctor')
    .alias('diagnose')
    .description('Diagnose the MindPM2/PM2 environment')
    .option('--json')
    .action(
      wrap(async (options) => {
        await runDoctor(options);
      })
    );

  program
    .command('monitor')
    .alias('monit')
    .description('Open the monitor')
    .option('--once', 'Render a single frame')
    .option('-i, --interval <ms>', 'Refresh interval in ms', (value) => Number(value))
    .option('--json')
    .action(
      wrap(async (options) => {
        if (!(await requirePm2(options))) return;
        await runMonitor(options);
      })
    );

  program
    .command('info')
    .alias('server')
    .description('Show server information')
    .option('--json')
    .action(
      wrap(async (options) => {
        await runInfo(options);
      })
    );

  program
    .command('details <target>')
    .alias('describe')
    .description('Show detailed process information')
    .option('--reveal', 'Reveal sensitive environment variables')
    .option('--json')
    .action(
      wrap(async (target, options) => {
        if (!(await requirePm2(options))) return;
        await runDetails(target, options);
      })
    );

  program
    .command('ecosystem [action] [file]')
    .alias('eco')
    .description('Manage ecosystem files (detect, create, start, reload, stop, validate, list, edit, delete)')
    .option('--json')
    .action(
      wrap(async (action, file, options) => {
        if (!(await requirePm2(options))) return;
        await runEcosystem(action ?? 'detect', file, options);
      })
    );

  program
    .command('config [action] [key] [value]')
    .description('Manage MindPM2 configuration')
    .option('--json')
    .action(
      wrap(async (action, key, value, options) => {
        await runConfig(action ?? 'show', key, value, options);
      })
    );

  program
    .command('cleanup')
    .description('Review and remove stopped/errored processes')
    .option('--json')
    .action(
      wrap(async (options) => {
        if (!(await requirePm2(options))) return;
        await runCleanup(options);
      })
    );

  program
    .command('update')
    .description('Check for MindPM2 updates')
    .option('--json')
    .action(
      wrap(async (options) => {
        await runUpdate(options);
      })
    );

  program
    .command('version')
    .description('Show version information')
    .option('--json')
    .action(
      wrap(async (options) => {
        await runVersion(options);
      })
    );

  program.action(
    wrap(async () => {
      const options = program.opts();
      if (options.version) {
        await runVersion(options);
        return;
      }
      const operands = program.args ?? [];
      if (operands.length > 0) {
        process.stderr.write(
          `${theme.error('✖')} Onbekend commando: "${operands[0]}".\n` +
            `${theme.muted('Gebruik "mindpm2 --help" voor beschikbare commando\'s.')}\n`
        );
        process.exitCode = 2;
        return;
      }
      if (!process.stdout.isTTY) {
        program.outputHelp();
        return;
      }
      await runInteractive(options);
    })
  );

  return program;
}

export async function runCli(argv = process.argv) {
  const program = buildProgram();
  program.exitOverride();
  try {
    await program.parseAsync(argv);
  } catch (error) {
    if (error?.code === 'commander.helpDisplayed' || error?.code === 'commander.version') {
      return;
    }
    if (error?.code === 'commander.unknownCommand' || error?.code === 'commander.unknownOption') {
      process.stderr.write(`${theme.error('✖')} ${error.message}\n`);
      process.exitCode = 2;
      return;
    }
    if (error?.code?.startsWith?.('commander.')) {
      process.exitCode = 2;
      return;
    }
    process.exitCode = handleError(error, {});
  }
}
