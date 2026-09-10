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
import { t } from '../../i18n/index.js';

async function resolveName(identifier) {
  if (!identifier) throw new InvalidInputError(t('error.noProcess'));
  return findProcess(identifier);
}

async function execute(identifier, options, { action, doneKey, busyKey, dangerous = false, confirmKey }) {
  const proc = await resolveName(identifier);
  if (dangerous) {
    const message = confirmKey ? t(confirmKey, { name: proc.name }) : t('action.confirmDelete', { name: proc.name });
    const ok = await confirmDangerous(message, options);
    if (!ok) return { cancelled: true, process: proc };
  }
  const result = await withSpinner(t(busyKey, { name: proc.name }), () => action(proc.name), {
    successText: t(doneKey, { name: proc.name }),
  });
  return { process: proc, result };
}

export async function runStop(identifier, options = {}) {
  return execute(identifier, options, {
    action: stopProcess,
    busyKey: 'action.stopping',
    doneKey: 'action.stopped',
    confirmKey: 'action.confirmStop',
  });
}

export async function runRestart(identifier, options = {}) {
  return execute(identifier, options, {
    action: restartProcess,
    busyKey: 'action.restarting',
    doneKey: 'action.restarted',
  });
}

export async function runReload(identifier, options = {}) {
  return execute(identifier, options, {
    action: reloadProcess,
    busyKey: 'action.reloading',
    doneKey: 'action.reloaded',
  });
}

export async function runDelete(identifier, options = {}) {
  return execute(identifier, options, {
    action: deleteProcess,
    busyKey: 'action.deleting',
    doneKey: 'action.deleted',
    dangerous: true,
    confirmKey: 'action.confirmDelete',
  });
}

export async function runReset(identifier, options = {}) {
  return execute(identifier, options, {
    action: resetProcess,
    busyKey: 'action.resetting',
    doneKey: 'action.resetDone',
    dangerous: true,
    confirmKey: 'action.confirmReset',
  });
}

export async function runScale(identifier, instances, options = {}) {
  const proc = await resolveName(identifier);
  const result = await withSpinner(
    t('action.scaling', { name: proc.name, count: instances }),
    () => scaleProcess(proc.name, instances),
    { successText: t('action.scaled', { name: proc.name, count: instances }) }
  );
  return { process: proc, result };
}

export { printSuccess };
