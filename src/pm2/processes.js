import path from 'node:path';
import {
  jlist,
  execPm2,
} from './daemon.js';
import { ProcessNotFoundError, CommandError } from '../utils/errors.js';
import { validateProcessIdentifier, validateInstances } from '../security/validator.js';
import { maskEnvVars } from '../security/sanitizer.js';
import { debug } from '../utils/debug.js';

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function normalizeExecMode(mode) {
  if (!mode) return 'fork';
  if (mode.includes('cluster')) return 'cluster';
  return 'fork';
}

export function normalizeStatus(status) {
  return String(status ?? 'unknown').toLowerCase();
}

export function normalizeProcess(raw) {
  const env = raw?.pm2_env ?? {};
  const monit = raw?.monit ?? {};
  const status = normalizeStatus(env.status);
  return {
    id: toNumber(raw?.pm_id, -1),
    name: raw?.name ?? env.name ?? 'unknown',
    pid: toNumber(raw?.pid, 0),
    status,
    mode: normalizeExecMode(env.exec_mode),
    instances: toNumber(env.instances, 1),
    nodeVersion: env.node_version ?? env.NODE_APP_INSTANCE ?? null,
    cpu: toNumber(monit.cpu, 0),
    memory: toNumber(monit.memory, 0),
    restartTime: toNumber(env.restart_time, 0),
    unstableRestarts: toNumber(env.unstable_restarts, 0),
    startedAt: toNumber(env.pm_uptime, 0),
    uptime: env.pm_uptime ? Math.max(0, Date.now() - Number(env.pm_uptime)) : 0,
    createdAt: toNumber(env.created_at, 0),
    script: env.pm_exec_path ?? env.pm_entry_point ?? null,
    cwd: env.pm_cwd ?? process.cwd(),
    args: env.args ?? [],
    interpreter: env.exec_interpreter ?? 'node',
    watch: Boolean(env.watch),
    maxMemoryRestart: env.max_memory_restart ?? null,
    version: env.version ?? null,
    namespace: env.namespace ?? 'default',
    env: env.env ?? {},
    outLogPath: env.pm_out_log_path ?? null,
    errLogPath: env.pm_err_log_path ?? null,
    combinedLogPath: env.pm_log_path ?? null,
    exitCode: env.exit_code ?? null,
    raw,
  };
}

export async function listProcesses() {
  const data = await jlist();
  return data.map(normalizeProcess).sort((a, b) => a.id - b.id);
}

export async function findProcess(identifier) {
  const id = validateProcessIdentifier(identifier);
  const processes = await listProcesses();
  const numeric = /^\d+$/.test(id);
  const found = processes.find(
    (proc) => (numeric && proc.id === Number(id)) || proc.name === id
  );
  if (!found) {
    throw new ProcessNotFoundError(identifier);
  }
  return found;
}

export async function listProcessNames() {
  const processes = await listProcesses();
  return processes.map((proc) => proc.name);
}

function buildExecOptions(options = {}) {
  const execOptions = { timeout: 60000 };
  if (options.env && Object.keys(options.env).length > 0) {
    execOptions.env = options.env;
  }
  return execOptions;
}

export async function startScript(script, options = {}) {
  const args = ['start', script];
  if (options.name) args.push('--name', String(options.name));
  if (options.instances !== undefined && options.instances !== null) {
    args.push('-i', String(options.instances));
  }
  if (options.execMode === 'cluster' && (options.instances === undefined || options.instances === null)) {
    args.push('-i', 'max');
  }
  if (options.interpreter) args.push('--interpreter', String(options.interpreter));
  if (options.watch) args.push('--watch');
  if (options.maxMemoryRestart) args.push('--max-memory-restart', String(options.maxMemoryRestart));
  if (options.cwd) {
    args.push('--cwd', String(options.cwd));
  }
  if (options.env && Object.keys(options.env).length > 0) {
    args.push('--update-env');
  }
  if (options.args && options.args.length > 0) {
    args.push('--');
    args.push(...options.args.map(String));
  }
  return execPm2(args, buildExecOptions(options));
}

export async function startNpmScript(packagePath, scriptName, options = {}) {
  const args = [
    'start',
    'npm',
    '--name',
    options.name || path.basename(packagePath || 'npm-app') || 'npm-app',
  ];
  if (options.instances !== undefined && options.instances !== null) {
    args.push('-i', String(options.instances));
  }
  if (options.cwd || (packagePath && packagePath !== 'npm')) {
    args.push('--cwd', String(options.cwd || packagePath));
  }
  if (options.env && Object.keys(options.env).length > 0) {
    args.push('--update-env');
  }
  args.push('--');
  args.push('run', scriptName || 'start');
  return execPm2(args, buildExecOptions(options));
}

export async function startCommand(command, options = {}) {
  const args = ['start', command];
  if (options.name) args.push('--name', String(options.name));
  if (options.instances !== undefined && options.instances !== null) {
    args.push('-i', String(options.instances));
  }
  if (options.cwd) args.push('--cwd', String(options.cwd));
  if (options.env && Object.keys(options.env).length > 0) {
    args.push('--update-env');
  }
  return execPm2(args, buildExecOptions(options));
}

export async function stopProcess(identifier) {
  const id = validateProcessIdentifier(identifier);
  return execPm2(['stop', id], { timeout: 30000 });
}

export async function restartProcess(identifier) {
  const id = validateProcessIdentifier(identifier);
  return execPm2(['restart', id], { timeout: 30000 });
}

export async function reloadProcess(identifier) {
  const id = validateProcessIdentifier(identifier);
  return execPm2(['reload', id], { timeout: 60000 });
}

export async function deleteProcess(identifier) {
  const id = validateProcessIdentifier(identifier);
  return execPm2(['delete', id], { timeout: 30000 });
}

export async function resetProcess(identifier) {
  const id = validateProcessIdentifier(identifier);
  return execPm2(['reset', id], { timeout: 30000 });
}

export async function scaleProcess(identifier, instances) {
  const id = validateProcessIdentifier(identifier);
  const count = validateInstances(instances);
  return execPm2(['scale', id, String(count)], { timeout: 60000 });
}

export async function startExisting(identifier) {
  const id = validateProcessIdentifier(identifier);
  return execPm2(['start', id], { timeout: 30000 });
}

export async function startApplication(options = {}) {
  const type = options.type ?? 'javascript';
  debug(`startApplication type=${type}`);
  switch (type) {
    case 'npm':
      return startNpmScript(options.path, options.npmScript, options);
    case 'command':
      return startCommand(options.command, options);
    case 'javascript':
      return startScript(options.path, options);
    default:
      throw new CommandError(`Onbekend applicatietype: ${type}`);
  }
}

export function maskProcessEnvironment(process, options = {}) {
  return maskEnvVars(process?.env ?? {}, options);
}
