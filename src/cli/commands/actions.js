import {
  stopProcess,
  restartProcess,
  reloadProcess,
  deleteProcess,
  resetProcess,
  scaleProcess,
  findProcess,
} from '../../pm2/processes.js';
import { withSpinner } from '../../ui/spinner.js';
import { printSuccess } from '../output.js';
import { confirmDangerous } from './helpers.js';
import { InvalidInputError } from '../../utils/errors.js';

async function resolveName(identifier) {
  if (!identifier) throw new InvalidInputError('Geen proces opgegeven.');
  const proc = await findProcess(identifier);
  return proc;
}

async function execute(identifier, options, { action, verb, dangerous = false, confirmMessage }) {
  const proc = await resolveName(identifier);
  if (dangerous) {
    const message =
      typeof confirmMessage === 'function'
        ? confirmMessage(proc)
        : `Weet je zeker dat je "${proc.name}" wilt ${verb}?`;
    const ok = await confirmDangerous(message, options);
    if (!ok) {
      return { cancelled: true, process: proc };
    }
  }
  const result = await withSpinner(`${proc.name} ${verb}...`, () => action(proc.name), {
    successText: `${proc.name} ${verb}.`,
  });
  return { process: proc, result };
}

export async function runStop(identifier, options = {}) {
  return execute(identifier, options, {
    action: stopProcess,
    verb: 'stoppen',
  });
}

export async function runRestart(identifier, options = {}) {
  return execute(identifier, options, {
    action: restartProcess,
    verb: 'herstarten',
  });
}

export async function runReload(identifier, options = {}) {
  return execute(identifier, options, {
    action: reloadProcess,
    verb: 'herladen',
  });
}

export async function runDelete(identifier, options = {}) {
  return execute(identifier, options, {
    action: deleteProcess,
    verb: 'verwijderen',
    dangerous: true,
    confirmMessage: (proc) =>
      `WAARSCHUWING: "${proc.name}" verwijderen? Dit kan niet ongedaan worden gemaakt via MindPM2.`,
  });
}

export async function runReset(identifier, options = {}) {
  return execute(identifier, options, {
    action: resetProcess,
    verb: 'resetten',
    dangerous: true,
  });
}

export async function runScale(identifier, instances, options = {}) {
  const proc = await resolveName(identifier);
  const result = await withSpinner(
    `${proc.name} schalen naar ${instances}...`,
    () => scaleProcess(proc.name, instances),
    { successText: `${proc.name} geschaald naar ${instances}.` }
  );
  return { process: proc, result };
}

export { printSuccess };
