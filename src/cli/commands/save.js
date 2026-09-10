import { listProcesses } from '../../pm2/processes.js';
import { save } from '../../pm2/startup.js';
import { withSpinner } from '../../ui/spinner.js';
import { printSuccess } from '../output.js';
import { confirmDangerous } from './helpers.js';
import { theme } from '../../ui/colors.js';

export async function runSave(options = {}) {
  const processes = await listProcesses();
  const online = processes.filter((proc) => proc.status === 'online').length;
  const other = processes.length - online;

  if (options.json) {
    await save();
    printSuccess(`PM2 process list opgeslagen (${processes.length} processen).`);
    return { saved: processes.length };
  }

  process.stdout.write(`${theme.muted('Huidige processen:')}\n`);
  process.stdout.write(`  ${online} online\n`);
  if (other > 0) process.stdout.write(`  ${other} gestopt/errored\n`);

  const ok = await confirmDangerous('Huidige PM2-processlijst opslaan?', {
    ...options,
    default: true,
  });
  if (!ok) return { cancelled: true };

  await withSpinner('PM2 processlijst opslaan...', () => save(), {
    successText: 'PM2 processlijst opgeslagen.',
  });
  return { saved: processes.length };
}

export default runSave;
