import { spawn } from 'node:child_process';
import * as eco from '../../pm2/ecosystem.js';
import { printSuccess, printWarning, printInfo, printJson } from '../output.js';
import { theme } from '../../ui/colors.js';
import { withSpinner } from '../../ui/spinner.js';
import { InvalidInputError } from '../../utils/errors.js';
import { confirmDangerous } from './helpers.js';

function resolveFile(target) {
  const file = target ?? eco.detect();
  if (!file) {
    throw new InvalidInputError('Geen ecosystem-bestand gevonden of opgegeven.');
  }
  return file;
}

export async function runEcosystem(action = 'detect', target, options = {}) {
  switch (action) {
    case 'detect':
      return detect(options);
    case 'list':
      return listApps(target, options);
    case 'create':
      return create(target, options);
    case 'validate':
      return validate(target, options);
    case 'start':
      return actionRun('start', target, options);
    case 'reload':
      return actionRun('reload', target, options);
    case 'restart':
      return actionRun('restart', target, options);
    case 'stop':
      return actionRun('stop', target, options);
    case 'delete':
      return actionRun('delete', target, options);
    case 'edit':
      return edit(target, options);
    default:
      throw new InvalidInputError(`Onbekende ecosystem actie: ${action}`);
  }
}

function detect(options = {}) {
  const files = eco.detectAll();
  if (options.json) {
    printJson({ files });
    return files;
  }
  if (files.length === 0) {
    printWarning('Geen ecosystem-bestand gevonden in de huidige map.');
    return [];
  }
  process.stdout.write(`${theme.primaryBold('Gedetecteerd:')}\n\n`);
  for (const file of files) {
    process.stdout.write(`  ${theme.success(file)}\n`);
  }
  return files;
}

async function listApps(target, options = {}) {
  const file = resolveFile(target);
  const apps = await eco.listApps(file);
  if (options.json) {
    printJson({ file, apps });
    return apps;
  }
  process.stdout.write(`${theme.primaryBold(file)}\n\n`);
  process.stdout.write(`${theme.muted('Applicaties:')}\n`);
  for (const app of apps) {
    process.stdout.write(`  ${app.name} ${theme.muted(`(${app.script ?? 'no script'})`)}\n`);
  }
  return apps;
}

function create(target, options = {}) {
  const name = target ?? 'ecosystem.config.cjs';
  const file = eco.createTemplate(name);
  printSuccess(`Ecosystem-bestand aangemaakt: ${file}`);
  return file;
}

async function validate(target, options = {}) {
  const file = resolveFile(target);
  const result = await eco.validate(file);
  if (options.json) {
    printJson(result);
    return result;
  }
  if (result.valid) {
    printSuccess(`Configuratie is geldig: ${file}`);
  } else {
    printWarning(`Configuratie bevat fouten: ${file}`);
  }
  for (const error of result.errors) process.stdout.write(`  ${theme.error('✖')} ${error}\n`);
  for (const warning of result.warnings) process.stdout.write(`  ${theme.warning('⚠')} ${warning}\n`);
  return result;
}

async function actionRun(action, target, options = {}) {
  const file = resolveFile(target);

  if (action === 'delete') {
    const ok = await confirmDangerous(`Alle processen uit "${file}" verwijderen?`, options);
    if (!ok) return { cancelled: true };
  }

  const fn = {
    start: eco.start,
    reload: eco.reload,
    restart: eco.restart,
    stop: eco.stop,
    delete: eco.remove,
  }[action];

  const result = await withSpinner(`Ecosystem ${action}: ${file}...`, () => fn(file), {
    successText: `Ecosystem ${action} voltooid: ${file}`,
  });
  return result;
}

function edit(target) {
  const file = resolveFile(target);
  const editor = process.env.VISUAL || process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'vi');
  printInfo(`Openen in ${editor}: ${file}`);
  return new Promise((resolve, reject) => {
    const child = spawn(editor, [file], { stdio: 'inherit', shell: false });
    child.on('exit', (code) => {
      if (code === 0) resolve(file);
      else reject(new InvalidInputError(`Editor stopte met code ${code}.`));
    });
    child.on('error', reject);
  });
}

export default runEcosystem;
