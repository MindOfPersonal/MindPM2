import { Separator } from '@inquirer/prompts';
import { theme } from '../ui/colors.js';
import { t } from '../i18n/index.js';

export const BACK_CHOICE = { name: theme.dim(t('common.back')), value: 'back' };
export const EXIT_CHOICE = { name: theme.dim(t('common.exit')), value: 'exit' };

export function mainMenuChoices() {
  return [
    { name: t('menu.dashboard'), value: 'dashboard' },
    { name: t('menu.processes'), value: 'processes' },
    new Separator(),
    { name: t('menu.start'), value: 'start' },
    { name: t('menu.logs'), value: 'logs' },
    { name: t('menu.monitor'), value: 'monitor' },
    new Separator(),
    { name: t('menu.startup'), value: 'startup' },
    { name: t('menu.save'), value: 'save' },
    { name: t('menu.ecosystem'), value: 'ecosystem' },
    new Separator(),
    { name: t('menu.server'), value: 'server' },
    { name: t('menu.cleanup'), value: 'cleanup' },
    { name: t('menu.settings'), value: 'settings' },
    new Separator(),
    { name: t('menu.doctor'), value: 'doctor' },
    { name: t('menu.update'), value: 'update' },
    new Separator(),
    EXIT_CHOICE,
  ];
}

export function processActionChoices(proc) {
  const choices = [
    { name: t('action.details'), value: 'details' },
    { name: t('action.logs'), value: 'logs' },
    { name: t('action.environment'), value: 'environment' },
    new Separator(),
  ];
  if (proc.status !== 'online') {
    choices.push({ name: theme.success(t('action.start')), value: 'start' });
  }
  if (proc.status === 'online') {
    choices.push({ name: theme.warning(t('action.stop')), value: 'stop' });
    choices.push({ name: t('action.restart'), value: 'restart' });
    choices.push({ name: t('action.reload'), value: 'reload' });
  }
  choices.push(new Separator());
  choices.push({ name: t('action.reset'), value: 'reset' });
  choices.push({ name: t('action.openDir'), value: 'open-cwd' });
  choices.push({ name: theme.error(t('action.delete')), value: 'delete' });
  choices.push(new Separator());
  choices.push(BACK_CHOICE);
  return choices;
}

export function logsMenuChoices() {
  return [
    { name: t('logs.menu.selectProcess'), value: 'process' },
    { name: t('logs.menu.all'), value: 'all' },
    new Separator(),
    { name: t('logs.menu.errors'), value: 'errors' },
    { name: t('logs.menu.output'), value: 'output' },
    { name: t('logs.menu.live'), value: 'live' },
    new Separator(),
    { name: t('logs.menu.clear'), value: 'clear' },
    { name: t('logs.menu.files'), value: 'files' },
    new Separator(),
    BACK_CHOICE,
  ];
}

export function saveRestoreChoices() {
  return [
    { name: t('save.menu.save'), value: 'save' },
    { name: t('save.menu.restore'), value: 'restore' },
    new Separator(),
    { name: t('save.menu.show'), value: 'show' },
    new Separator(),
    BACK_CHOICE,
  ];
}

export function startupChoices() {
  return [
    { name: t('startup.menu.generate'), value: 'generate' },
    { name: t('startup.menu.status'), value: 'status' },
    { name: t('startup.menu.service'), value: 'service' },
    new Separator(),
    { name: theme.warning(t('startup.menu.disable')), value: 'disable' },
    new Separator(),
    BACK_CHOICE,
  ];
}

export function ecosystemChoices() {
  return [
    { name: t('eco.menu.detect'), value: 'detect' },
    { name: t('eco.menu.create'), value: 'create' },
    new Separator(),
    { name: t('eco.menu.start'), value: 'start' },
    { name: t('eco.menu.reload'), value: 'reload' },
    { name: t('eco.menu.stop'), value: 'stop' },
    new Separator(),
    { name: t('eco.menu.edit'), value: 'edit' },
    { name: t('eco.menu.validate'), value: 'validate' },
    new Separator(),
    BACK_CHOICE,
  ];
}

export function settingsChoices() {
  return [
    { name: t('config.show'), value: 'show' },
    { name: t('settings.changeTheme'), value: 'theme' },
    { name: t('settings.changeLanguage'), value: 'language' },
    new Separator(),
    { name: t('config.edit'), value: 'edit' },
    new Separator(),
    { name: theme.warning(t('config.reset')), value: 'reset' },
    new Separator(),
    BACK_CHOICE,
  ];
}

export function sortChoices() {
  return [
    { name: t('table.name'), value: 'name' },
    { name: t('table.id'), value: 'id' },
    { name: t('table.status'), value: 'status' },
    new Separator(),
    { name: t('table.cpu'), value: '-cpu' },
    { name: t('table.memory'), value: '-memory' },
    { name: t('table.uptime'), value: '-uptime' },
    { name: t('table.restarts'), value: '-restarts' },
    { name: t('table.pid'), value: 'pid' },
    new Separator(),
    BACK_CHOICE,
  ];
}
