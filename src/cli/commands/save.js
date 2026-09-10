import { listProcesses } from '../../pm2/processes.js';
import { save } from '../../pm2/startup.js';
import { withSpinner } from '../../ui/spinner.js';
import { printJson } from '../output.js';
import { confirmDangerous } from './helpers.js';
import { theme } from '../../ui/colors.js';
import { t } from '../../i18n/index.js';

export async function runSave(options = {}) {
  const processes = await listProcesses();
  const online = processes.filter((proc) => proc.status === 'online').length;
  const other = processes.length - online;

  if (options.json) {
    await save();
    const result = { saved: processes.length, online, other };
    printJson(result);
    return result;
  }

  process.stdout.write(`${theme.muted(t('save.current'))}\n`);
  process.stdout.write(`  ${t('save.online', { count: online })}\n`);
  if (other > 0) process.stdout.write(`  ${t('save.other', { count: other })}\n`);

  const ok = await confirmDangerous(t('save.confirm'), { ...options, default: true });
  if (!ok) return { cancelled: true };

  await withSpinner(t('save.saving'), () => save(), {
    successText: t('save.saved'),
  });
  return { saved: processes.length };
}

export default runSave;
