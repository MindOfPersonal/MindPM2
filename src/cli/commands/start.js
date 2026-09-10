import fs from 'node:fs';
import path from 'node:path';
import {
  startApplication,
  startExisting,
  findProcess,
} from '../../pm2/processes.js';
import { start as startEcosystem } from '../../pm2/ecosystem.js';
import { withSpinner } from '../../ui/spinner.js';
import { printSuccess, printInfo } from '../output.js';
import { isEcosystemPath, existingFile } from './helpers.js';
import { validateScriptPath, validateMemory, validateInstances } from '../../security/validator.js';
import { InvalidInputError } from '../../utils/errors.js';
import { resolveInputPath } from '../../utils/paths.js';
import { maskEnvVars } from '../../security/sanitizer.js';
import { theme } from '../../ui/colors.js';

function parseEnvList(envList) {
  const env = {};
  for (const entry of envList ?? []) {
    const index = String(entry).indexOf('=');
    if (index === -1) throw new InvalidInputError(`Ongeldige env variabele: ${entry}. Gebruik KEY=VALUE.`);
    env[entry.slice(0, index)] = entry.slice(index + 1);
  }
  return env;
}

function normalizeOptions(options = {}) {
  const instances = validateInstances(options.instances);
  return {
    name: options.name,
    instances,
    execMode: options.cluster ? 'cluster' : options.fork ? 'fork' : undefined,
    watch: Boolean(options.watch),
    maxMemoryRestart: validateMemory(options.maxMemory),
    cwd: options.cwd ? resolveInputPath(options.cwd) : undefined,
    interpreter: options.interpreter,
    env: parseEnvList(options.env),
    args: options.args ? String(options.args).split(' ').filter(Boolean) : [],
  };
}

export async function runStart(target, options = {}) {
  const normalized = normalizeOptions(options);

  if (!target) {
    if (options.command) {
      return runWithSpinner(() =>
        startApplication({ type: 'command', command: options.command, ...normalized })
      );
    }
    throw new InvalidInputError(
      'Geen applicatie opgegeven. Gebruik "mindpm2 start <script>" of start de interactieve modus.'
    );
  }

  if (existingFile(target) && isEcosystemPath(target)) {
    return runWithSpinner(() => startEcosystem(target), `Ecosystem gestart: ${target}`);
  }

  if (options.npm) {
    return runWithSpinner(() =>
      startApplication({ type: 'npm', path: target, npmScript: options.npmScript ?? 'start', ...normalized })
    );
  }

  if (options.command) {
    return runWithSpinner(() =>
      startApplication({ type: 'command', command: target, ...normalized })
    );
  }

  if (existingFile(target)) {
    const resolved = validateScriptPath(resolveInputPath(target), fs);
    return runWithSpinner(() =>
      startApplication({ type: 'javascript', path: resolved, ...normalized })
    );
  }

  try {
    const proc = await findProcess(target);
    return runWithSpinner(() => startExisting(proc.name), `Gestart: ${proc.name}`);
  } catch {
    const resolved = path.resolve(target);
    if (fs.existsSync(resolved)) {
      return runWithSpinner(() =>
        startApplication({ type: 'javascript', path: resolved, ...normalized })
      );
    }
    throw new InvalidInputError(
      `Kan "${target}" niet starten: geen bestaand bestand en geen bekend PM2-proces.`
    );
  }
}

async function runWithSpinner(fn, successText) {
  const result = await withSpinner('Applicatie starten...', fn, {
    successText: successText ?? 'Applicatie gestart.',
  });
  return result;
}

export async function describeStartOptions(options = {}) {
  const normalized = normalizeOptions(options);
  const lines = [
    ['Name', normalized.name ?? '-'],
    ['Instances', normalized.instances ?? 1],
    ['Mode', normalized.execMode ?? 'fork'],
    ['Watch', normalized.watch ? 'enabled' : 'disabled'],
    ['Max Memory', normalized.maxMemoryRestart ?? '-'],
  ];
  process.stdout.write(
    `${lines.map(([key, value]) => `${theme.muted(String(key).padEnd(14))}${value}`).join('\n')}\n`
  );
  if (Object.keys(normalized.env).length > 0) {
    const masked = maskEnvVars(normalized.env);
    process.stdout.write(`${theme.muted('Environment')}\n`);
    for (const [key, value] of Object.entries(masked)) {
      process.stdout.write(`  ${key}=${value}\n`);
    }
  }
  return normalized;
}

export { printSuccess, printInfo };
export default runStart;
