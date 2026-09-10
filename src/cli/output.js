import { theme } from '../ui/colors.js';
import { processTable } from '../ui/tables.js';
import { panel } from '../ui/boxes.js';
import { exitCodeFor, ExitCode } from '../utils/errors.js';
import { isDebugEnabled } from '../utils/debug.js';
import { logger } from '../utils/logger.js';

export function print(value = '') {
  process.stdout.write(`${value}\n`);
}

export function printSuccess(message) {
  print(`${theme.success('✔')} ${message}`);
}

export function printWarning(message) {
  print(`${theme.warning('⚠')} ${message}`);
}

export function printError(message) {
  process.stderr.write(`${theme.error('✖')} ${message}\n`);
}

export function printInfo(message) {
  print(`${theme.muted('ℹ')} ${message}`);
}

export function printJson(data) {
  print(JSON.stringify(data, null, 2));
}

export function printProcesses(processes, options = {}) {
  if (options.json) {
    printJson({
      processes: processes.map((proc) => ({
        id: proc.id,
        name: proc.name,
        status: proc.status,
        mode: proc.mode,
        cpu: proc.cpu,
        memory: proc.memory,
        restarts: proc.restartTime,
        pid: proc.pid,
        uptime: proc.uptime,
        script: proc.script,
      })),
    });
    return;
  }
  print(processTable(processes));
}

export function handleError(error, options = {}) {
  logger.error(error?.stack || error?.message || String(error));
  const code = exitCodeFor(error);

  if (options.json) {
    printJson({
      error: true,
      message: error?.message ?? String(error),
      hint: error?.hint ?? null,
      code,
    });
    return code;
  }

  const lines = [`${theme.error.bold('✖')} ${theme.error.bold(error?.message ?? String(error))}`];
  if (error?.hint) {
    lines.push('', error.hint);
  }
  if (isDebugEnabled()) {
    if (error?.technical) lines.push('', theme.muted(`Technical: ${error.technical}`));
    lines.push('', theme.muted(error?.stack ?? ''));
  }
  process.stderr.write(`\n${panel(undefined, lines.join('\n'), { borderColor: 'red' })}\n`);
  return code || ExitCode.GENERAL_ERROR;
}

export { ExitCode };
