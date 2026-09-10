import { listProcesses } from '../../pm2/processes.js';
import { resurrect } from '../../pm2/startup.js';
import { withSpinner } from '../../ui/spinner.js';
import { theme } from '../../ui/colors.js';
import { confirmDangerous } from './helpers.js';
import { t } from '../../i18n/index.js';

export async function runResurrect(options = {}) {
  const before = await listProcesses();
  const beforeNames = new Set(before.map((proc) => proc.name));

  const ok = await confirmDangerous(t('restore.confirm'), { ...options, default: true });
  if (!ok) return { cancelled: true };

  await withSpinner(t('restore.restoring'), () => resurrect(), {
    successText: t('restore.restored'),
  });

  const after = await listProcesses();
  const started = after.filter((proc) => !beforeNames.has(proc.name));
  if (started.length > 0 && !options.json) {
    process.stdout.write(`${theme.muted(t('restore.started'))}\n`);
    for (const proc of started) {
      process.stdout.write(`  ${theme.success(proc.name)}\n`);
    }
  }

  return { restored: started.map((proc) => proc.name) };
}

export default runResurrect;
