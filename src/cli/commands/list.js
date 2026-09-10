import { listProcesses, findProcess } from '../../pm2/processes.js';
import { printProcesses, printJson } from '../output.js';
import { sortProcesses } from './helpers.js';
import { theme } from '../../ui/colors.js';
import { processTable } from '../../ui/tables.js';
import { t } from '../../i18n/index.js';

export async function runList(target, options = {}) {
  if (target) {
    const proc = await findProcess(target);
    if (options.json) {
      printJson(proc);
      return proc;
    }
    process.stdout.write(`${processTable([proc])}\n`);
    return proc;
  }

  let processes = await listProcesses();
  if (options.sort) {
    processes = sortProcesses(processes, options.sort);
  }

  if (options.status) {
    processes = processes.filter((proc) => proc.status === options.status);
  }

  if (options.json) {
    printProcesses(processes, { json: true });
    return processes;
  }

  process.stdout.write(`${processTable(processes)}\n`);
  if (processes.length > 0) {
    const online = processes.filter((proc) => proc.status === 'online').length;
    process.stdout.write(theme.muted(`\n${t('list.summary', { total: processes.length, online })}\n`));
  }
  return processes;
}

export default runList;
