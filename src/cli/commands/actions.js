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

export const BULK_TARGET = 'all';

export function isBulkTarget(identifier) {
  return String(identifier ?? '').trim().toLowerCase() === BULK_TARGET;
}

async function resolveTarget(identifier) {
  if (!identifier) throw new InvalidInputError(t('error.noProcess'));
  if (isBulkTarget(identifier)) {
    return { name: BULK_TARGET, label: BULK_TARGET, bulk: true, process: null };
  }
  const proc = await findProcess(identifier);
  return { name: proc.name, label: proc.name, bulk: false, process: proc };
}

async function execute(
  identifier,
  options,
  {
    action,
    busyKey,
    doneKey,
    bulkBusyKey,
    bulkDoneKey,
    dangerous = false,
    confirmKey,
    bulkConfirmKey,
  }
) {
  const target = await resolveTarget(identifier);
  if (dangerous) {
    const key = target.bulk && bulkConfirmKey ? bulkConfirmKey : confirmKey;
    const message = key ? t(key, { name: target.label }) : t('action.confirmDelete', { name: target.label });
    const ok = await confirmDangerous(message, options);
    if (!ok) return { cancelled: true, process: target.process, bulk: target.bulk };
  }
  const busyText = target.bulk && bulkBusyKey ? t(bulkBusyKey) : t(busyKey, { name: target.label });
  const doneText = target.bulk && bulkDoneKey ? t(bulkDoneKey) : t(doneKey, { name: target.label });
  const result = await withSpinner(busyText, () => action(target.name), {
    successText: doneText,
  });
  return { process: target.process, bulk: target.bulk, result };
}

export async function runStop(identifier, options = {}) {
  return execute(identifier, options, {
    action: stopProcess,
    busyKey: 'action.stopping',
    doneKey: 'action.stopped',
    bulkBusyKey: 'action.stoppingAll',
    bulkDoneKey: 'action.stoppedAll',
  });
}

export async function runRestart(identifier, options = {}) {
  return execute(identifier, options, {
    action: restartProcess,
    busyKey: 'action.restarting',
    doneKey: 'action.restarted',
    bulkBusyKey: 'action.restartingAll',
    bulkDoneKey: 'action.restartedAll',
  });
}

export async function runReload(identifier, options = {}) {
  return execute(identifier, options, {
    action: reloadProcess,
    busyKey: 'action.reloading',
    doneKey: 'action.reloaded',
    bulkBusyKey: 'action.reloadingAll',
    bulkDoneKey: 'action.reloadedAll',
  });
}

export async function runDelete(identifier, options = {}) {
  return execute(identifier, options, {
    action: deleteProcess,
    busyKey: 'action.deleting',
    doneKey: 'action.deleted',
    bulkBusyKey: 'action.deletingAll',
    bulkDoneKey: 'action.deletedAll',
    dangerous: true,
    confirmKey: 'action.confirmDelete',
    bulkConfirmKey: 'action.confirmDeleteAll',
  });
}

export async function runReset(identifier, options = {}) {
  return execute(identifier, options, {
    action: resetProcess,
    busyKey: 'action.resetting',
    doneKey: 'action.resetDone',
    bulkBusyKey: 'action.resettingAll',
    bulkDoneKey: 'action.resetAll',
    dangerous: true,
    confirmKey: 'action.confirmReset',
    bulkConfirmKey: 'action.confirmResetAll',
  });
}

export async function runScale(identifier, instances, options = {}) {
  if (isBulkTarget(identifier)) {
    throw new InvalidInputError(t('error.scaleAll'));
  }
  const proc = await findProcess(identifier);
  const result = await withSpinner(
    t('action.scaling', { name: proc.name, count: instances }),
    () => scaleProcess(proc.name, instances),
    { successText: t('action.scaled', { name: proc.name, count: instances }) }
  );
  return { process: proc, result };
}

export { printSuccess };
