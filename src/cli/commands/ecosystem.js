import { spawn } from 'node:child_process';
import * as eco from '../../pm2/ecosystem.js';
import { printSuccess, printWarning, printInfo, printJson } from '../output.js';
import { theme } from '../../ui/colors.js';
import { withSpinner } from '../../ui/spinner.js';
import { InvalidInputError } from '../../utils/errors.js';
import { confirmDangerous } from './helpers.js';
import { t } from '../../i18n/index.js';

function resolveFile(target) {
  const file = target ?? eco.detect();
  if (!file) {
    throw new InvalidInputError(t('error.noEcosystem'));
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
    case 'reload':
    case 'restart':
    case 'stop':
    case 'delete':
      return actionRun(action, target, options);
    case 'edit':
      return edit(target, options);
    default:
      throw new InvalidInputError(t('error.unknownAction', { action }));
  }
}

function detect(options = {}) {
  const files = eco.detectAll();
  if (options.json) {
    printJson({ files });
    return files;
  }
  if (files.length === 0) {
    printWarning(t('eco.none'));
    return [];
  }
  process.stdout.write(`${theme.primaryBold(t('eco.detected'))}\n\n`);
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
  process.stdout.write(`${theme.muted(t('eco.apps'))}\n`);
  for (const app of apps) {
    process.stdout.write(`  ${app.name} ${theme.muted(`(${app.script ?? 'no script'})`)}\n`);
  }
  return apps;
}

function create(target, options = {}) {
  void options;
  const name = target ?? 'ecosystem.config.cjs';
  const file = eco.createTemplate(name);
  printSuccess(t('eco.created', { path: file }));
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
    printSuccess(t('eco.valid', { path: file }));
  } else {
    printWarning(t('eco.invalid', { path: file }));
  }
  for (const error of result.errors) process.stdout.write(`  ${theme.error('✖')} ${error}\n`);
  for (const warning of result.warnings) process.stdout.write(`  ${theme.warning('⚠')} ${warning}\n`);
  return result;
}

async function actionRun(action, target, options = {}) {
  const file = resolveFile(target);

  if (action === 'delete') {
    const ok = await confirmDangerous(t('eco.confirmDelete', { path: file }), options);
    if (!ok) return { cancelled: true };
  }

  const fn = {
    start: eco.start,
    reload: eco.reload,
    restart: eco.restart,
    stop: eco.stop,
    delete: eco.remove,
  }[action];

  const result = await withSpinner(
    t('eco.actionDone', { action, path: file }),
    () => fn(file),
    { successText: t('eco.actionDone', { action, path: file }) }
  );
  return result;
}

function edit(target) {
  const file = resolveFile(target);
  const editor =
    process.env.VISUAL || process.env.EDITOR || (process.platform === 'win32' ? 'notepad' : 'vi');
  printInfo(t('eco.openEditor', { editor, path: file }));
  return new Promise((resolve, reject) => {
    const child = spawn(editor, [file], { stdio: 'inherit', shell: false });
    child.on('exit', (code) => {
      if (code === 0) resolve(file);
      else reject(new InvalidInputError(t('error.editorFailed', { code })));
    });
    child.on('error', reject);
  });
}

export default runEcosystem;
