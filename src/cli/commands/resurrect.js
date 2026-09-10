import { listProcesses } from '../../pm2/processes.js';
import { resurrect } from '../../pm2/startup.js';
import { withSpinner } from '../../ui/spinner.js';
import { printSuccess } from '../output.js';
import { confirmDangerous } from './helpers.js';
import { theme } from '../../ui/colors.js';

export async function runResurrect(options = {}) {
  const before = await listProcesses();
  const beforeNames = new Set(before.map((proc) => proc.name));

  const ok = await confirmDangerous(
    'Opgeslagen PM2-processen terugzetten (pm2 resurrect)?',
    { ...options, default: true }
  );
  if (!ok) return { cancelled: true };

  await withSpinner('PM2-processen terugzetten...', () => resurrect(), {
    successText: 'PM2 processlijst teruggezet.',
  });

  const after = await listProcesses();
  const started = after.filter((proc) => !beforeNames.has(proc.name));
  if (started.length > 0) {
    process.stdout.write(`${theme.muted('Gestart:')}\n`);
    for (const proc of started) {
      process.stdout.write(`  ${theme.success(proc.name)}\n`);
    }
  }

  if (options.json) {
    return { restored: started.map((proc) => proc.name) };
  }
  return { restored: started.map((proc) => proc.name) };
}

export default runResurrect;
