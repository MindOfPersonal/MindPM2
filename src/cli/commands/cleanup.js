import { listProcesses, deleteProcess } from '../../pm2/processes.js';
import { printSuccess, printJson, printInfo } from '../output.js';
import { theme } from '../../ui/colors.js';
import { selectPrompt, BACK } from '../prompts.js';
import { withSpinner } from '../../ui/spinner.js';
import { confirmDangerous } from './helpers.js';
import { t } from '../../i18n/index.js';

export async function findCleanupCandidates() {
  const processes = await listProcesses();
  return {
    stopped: processes.filter((proc) => ['stopped', 'stopped_gracefully'].includes(proc.status)),
    errored: processes.filter((proc) => proc.status === 'errored'),
    all: processes,
  };
}

export async function runCleanup(options = {}) {
  const candidates = await findCleanupCandidates();
  const total = candidates.stopped.length + candidates.errored.length;

  if (options.json) {
    printJson({
      stopped: candidates.stopped.map((proc) => proc.name),
      errored: candidates.errored.map((proc) => proc.name),
    });
    return candidates;
  }

  process.stdout.write(`${theme.primaryBold(t('cleanup.title'))}\n\n`);
  if (total === 0) {
    printSuccess(t('cleanup.none'));
    return candidates;
  }

  process.stdout.write(`${t('cleanup.stopped', { count: candidates.stopped.length })}\n`);
  process.stdout.write(`${t('cleanup.errored', { count: candidates.errored.length })}\n\n`);

  if (options.yes) {
    return removeMany([...candidates.stopped, ...candidates.errored], options);
  }

  const action = await selectPrompt(t('cleanup.actions'), [
    { name: t('cleanup.removeStopped'), value: 'stopped' },
    { name: t('cleanup.removeErrored'), value: 'errored' },
    { name: t('cleanup.review'), value: 'review' },
    { name: t('common.cancel'), value: 'cancel' },
  ]);

  if (action === BACK || action === 'cancel') return { cancelled: true };
  if (action === 'stopped') return removeMany(candidates.stopped, options);
  if (action === 'errored') return removeMany(candidates.errored, options);
  if (action === 'review') {
    return reviewIndividually([...candidates.stopped, ...candidates.errored], options);
  }
  return { cancelled: true };
}

async function removeMany(processes, options = {}) {
  if (processes.length === 0) {
    printInfo(t('cleanup.nothing'));
    return { removed: [] };
  }
  const names = processes.map((proc) => proc.name);
  const confirmText = t('cleanup.confirm', {
    list: names.map((name) => `  • ${name}`).join('\n'),
  });
  const ok = await confirmDangerous(confirmText, options);
  if (!ok) return { cancelled: true };

  const removed = [];
  for (const proc of processes) {
    await withSpinner(t('action.deleting', { name: proc.name }), () => deleteProcess(proc.name), {
      successText: t('action.deleted', { name: proc.name }),
    });
    removed.push(proc.name);
  }
  return { removed };
}

async function reviewIndividually(processes, options = {}) {
  const removed = [];
  for (const proc of processes) {
    const ok = await confirmDangerous(
      t('cleanup.confirmOne', { name: proc.name, status: proc.status }),
      options
    );
    if (ok) {
      await deleteProcess(proc.name);
      removed.push(proc.name);
      printSuccess(t('action.deleted', { name: proc.name }));
    }
  }
  return { removed };
}

export default runCleanup;
