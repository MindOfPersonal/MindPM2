import { Separator } from '@inquirer/prompts';
import { theme } from '../ui/colors.js';
import { t } from '../i18n/index.js';

export const BACK_CHOICE = { name: theme.dim(t('common.back')), value: 'back' };
export const EXIT_CHOICE = { name: theme.dim(t('common.exit')), value: 'exit' };

function separator() {
  return new Separator(' ');
}

function item(icon, label, value, color = theme.dim) {
  return { name: `${color(icon)}  ${label}`, value };
}

export function mainMenuChoices() {
  return [
    item('◆', t('menu.dashboard'), 'dashboard', theme.primary),
    item('▦', t('menu.processes'), 'processes', theme.primary),
    separator(),
    item('▶', t('menu.start'), 'start', theme.success),
    item('≡', t('menu.logs'), 'logs', theme.primary),
    item('◉', t('menu.monitor'), 'monitor', theme.primary),
    separator(),
    item('⇧', t('menu.startup'), 'startup', theme.primary),
    item('⇅', t('menu.save'), 'save', theme.primary),
    item('❖', t('menu.ecosystem'), 'ecosystem', theme.primary),
    separator(),
    item('▣', t('menu.server'), 'server', theme.primary),
    item('⌫', t('menu.cleanup'), 'cleanup', theme.warning),
    item('⚙', t('menu.settings'), 'settings', theme.primary),
    separator(),
    item('✚', t('menu.doctor'), 'doctor', theme.primary),
    item('↻', t('menu.update'), 'update', theme.primary),
    separator(),
    EXIT_CHOICE,
  ];
}

export function processActionChoices(proc) {
  const choices = [
    item('▤', t('action.details'), 'details'),
    item('≡', t('action.logs'), 'logs'),
    item('⚙', t('action.environment'), 'environment'),
    separator(),
  ];
  if (proc.status !== 'online') {
    choices.push(item('▶', t('action.start'), 'start', theme.success));
  }
  choices.push(item('↻', t('action.restart'), 'restart', theme.primary));
  if (proc.status === 'online') {
    choices.push(item('■', t('action.stop'), 'stop', theme.warning));
    choices.push(item('⟳', t('action.reload'), 'reload', theme.primary));
  }
  choices.push(separator());
  choices.push(item('↺', t('action.reset'), 'reset'));
  choices.push(item('⌂', t('action.openDir'), 'open-cwd'));
  choices.push(item('✕', t('action.delete'), 'delete', theme.error));
  choices.push(separator());
  choices.push(BACK_CHOICE);
  return choices;
}

export function bulkActionChoices() {
  return [
    item('▶', t('action.startAll'), 'start-all', theme.success),
    item('↻', t('action.restartAll'), 'restart-all', theme.primary),
    item('⟳', t('action.reloadAll'), 'reload-all', theme.primary),
    item('■', t('action.stopAll'), 'stop-all', theme.warning),
    separator(),
    item('✕', t('action.deleteAll'), 'delete-all', theme.error),
    separator(),
    BACK_CHOICE,
  ];
}

export function logsMenuChoices() {
  return [
    item('▦', t('logs.menu.selectProcess'), 'process'),
    item('▤', t('logs.menu.all'), 'all'),
    separator(),
    item('✖', t('logs.menu.errors'), 'errors'),
    item('≡', t('logs.menu.output'), 'output'),
    item('◉', t('logs.menu.live'), 'live'),
    separator(),
    item('⌫', t('logs.menu.clear'), 'clear'),
    item('▣', t('logs.menu.files'), 'files'),
    separator(),
    BACK_CHOICE,
  ];
}

export function saveRestoreChoices() {
  return [
    item('⇩', t('save.menu.save'), 'save'),
    item('⇧', t('save.menu.restore'), 'restore'),
    separator(),
    item('▤', t('save.menu.show'), 'show'),
    separator(),
    BACK_CHOICE,
  ];
}

export function startupChoices() {
  return [
    item('⚙', t('startup.menu.generate'), 'generate'),
    item('◉', t('startup.menu.status'), 'status'),
    item('▣', t('startup.menu.service'), 'service'),
    separator(),
    item('✕', t('startup.menu.disable'), 'disable', theme.warning),
    separator(),
    BACK_CHOICE,
  ];
}

export function ecosystemChoices() {
  return [
    item('◉', t('eco.menu.detect'), 'detect'),
    item('✚', t('eco.menu.create'), 'create'),
    separator(),
    item('▶', t('eco.menu.start'), 'start', theme.success),
    item('⟳', t('eco.menu.reload'), 'reload'),
    item('■', t('eco.menu.stop'), 'stop', theme.warning),
    separator(),
    item('⌂', t('eco.menu.edit'), 'edit'),
    item('✔', t('eco.menu.validate'), 'validate'),
    separator(),
    BACK_CHOICE,
  ];
}

export function settingsChoices() {
  return [
    item('▤', t('config.show'), 'show'),
    item('◆', t('settings.changeTheme'), 'theme'),
    item('⌘', t('settings.changeLanguage'), 'language'),
    separator(),
    item('⌂', t('config.edit'), 'edit'),
    separator(),
    item('✕', t('config.reset'), 'reset', theme.warning),
    separator(),
    BACK_CHOICE,
  ];
}

export function sortChoices() {
  return [
    item('▤', t('table.name'), 'name'),
    item('#', t('table.id'), 'id'),
    item('◉', t('table.status'), 'status'),
    separator(),
    item('▤', t('table.cpu'), '-cpu'),
    item('▤', t('table.memory'), '-memory'),
    item('◐', t('table.uptime'), '-uptime'),
    item('↻', t('table.restarts'), '-restarts'),
    item('#', t('table.pid'), 'pid'),
    separator(),
    BACK_CHOICE,
  ];
}
