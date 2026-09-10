import { listProcesses, deleteProcess } from '../../pm2/processes.js';
import { printSuccess, printJson, printInfo } from '../output.js';
import { theme } from '../../ui/colors.js';
import { selectPrompt, BACK } from '../prompts.js';
import { withSpinner } from '../../ui/spinner.js';
import { confirmDangerous } from './helpers.js';

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

  process.stdout.write(`${theme.primaryBold('Process Cleanup')}\n\n`);
  if (total === 0) {
    printSuccess('Geen gestopte of foutieve processen gevonden.');
    return candidates;
  }

  process.stdout.write(`${candidates.stopped.length} stopped processes\n`);
  process.stdout.write(`${candidates.errored.length} errored processen\n\n`);

  if (options.yes) {
    return removeMany([...candidates.stopped, ...candidates.errored], options);
  }

  const action = await selectPrompt('Acties:', [
    { name: 'Remove stopped processes', value: 'stopped' },
    { name: 'Remove errored processes', value: 'errored' },
    { name: 'Review individually', value: 'review' },
    { name: 'Cancel', value: 'cancel' },
  ]);

  if (action === BACK || action === 'cancel') return { cancelled: true };
  if (action === 'stopped') return removeMany(candidates.stopped, options);
  if (action === 'errored') return removeMany(candidates.errored, options);
  if (action === 'review') return reviewIndividually([...candidates.stopped, ...candidates.errored], options);
  return { cancelled: true };
}

async function removeMany(processes, options = {}) {
  if (processes.length === 0) {
    printInfo('Niets te verwijderen.');
    return { removed: [] };
  }
  const names = processes.map((proc) => proc.name);
  const ok = await confirmDangerous(
    `Deze processen verwijderen?\n\n${names.map((name) => `  • ${name}`).join('\n')}\n\nDit kan niet ongedaan worden gemaakt.`,
    options
  );
  if (!ok) return { cancelled: true };

  const removed = [];
  for (const proc of processes) {
    await withSpinner(`${proc.name} verwijderen...`, () => deleteProcess(proc.name), {
      successText: `${proc.name} verwijderd.`,
    });
    removed.push(proc.name);
  }
  return { removed };
}

async function reviewIndividually(processes, options = {}) {
  const removed = [];
  for (const proc of processes) {
    const ok = await confirmDangerous(`"${proc.name}" (${proc.status}) verwijderen?`, options);
    if (ok) {
      await deleteProcess(proc.name);
      removed.push(proc.name);
      printSuccess(`${proc.name} verwijderd.`);
    }
  }
  return { removed };
}

export default runCleanup;
