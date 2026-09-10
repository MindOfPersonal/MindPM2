export * as daemon from './daemon.js';
export * as processes from './processes.js';
export * as logs from './logs.js';
export * as startup from './startup.js';
export * as ecosystem from './ecosystem.js';

export {
  getPm2Version,
  getPm2Binary,
  isPm2Installed,
  isDaemonRunning,
  ping,
  jlist,
  execPm2,
  spawnPm2,
  ensurePm2Available,
  supportsVersion,
} from './daemon.js';

export {
  listProcesses,
  findProcess,
  startApplication,
  startScript,
  stopProcess,
  restartProcess,
  reloadProcess,
  deleteProcess,
  resetProcess,
  scaleProcess,
  startExisting,
  normalizeProcess,
} from './processes.js';

export {
  readProcessLogs,
  readAllLogs,
  flushLogs,
  reloadLogs,
  streamLogsToConsole,
  listLogFiles,
} from './logs.js';

export { save, resurrect, generateStartupCommand, getStartupStatus, unstartup } from './startup.js';

export { detect as detectEcosystem, parse as parseEcosystem } from './ecosystem.js';

import {
  getPm2Version as _getVersion,
  isPm2Installed as _isInstalled,
  isDaemonRunning as _isDaemonRunning,
  ensurePm2Available as _ensure,
  ping as _ping,
} from './daemon.js';
import { listProcesses as _list } from './processes.js';

export const manager = {
  getVersion: _getVersion,
  isInstalled: _isInstalled,
  isRunning: _isDaemonRunning,
  ensureAvailable: _ensure,
  ping: _ping,
  list: _list,
};

export default manager;
