import { Separator } from '@inquirer/prompts';
import { theme } from '../ui/colors.js';

export const BACK_CHOICE = { name: theme.dim('← Back'), value: 'back' };
export const EXIT_CHOICE = { name: theme.dim('Exit'), value: 'exit' };

export function mainMenuChoices() {
  return [
    { name: 'Dashboard', value: 'dashboard' },
    { name: 'Processes', value: 'processes' },
    new Separator(),
    { name: 'Start Application', value: 'start' },
    { name: 'Process Logs', value: 'logs' },
    { name: 'Monitoring', value: 'monitor' },
    new Separator(),
    { name: 'Startup', value: 'startup' },
    { name: 'Save / Restore', value: 'save' },
    { name: 'Ecosystem', value: 'ecosystem' },
    new Separator(),
    { name: 'Server Information', value: 'server' },
    { name: 'Cleanup', value: 'cleanup' },
    { name: 'Settings', value: 'settings' },
    new Separator(),
    { name: 'Doctor', value: 'doctor' },
    { name: 'Update', value: 'update' },
    new Separator(),
    EXIT_CHOICE,
  ];
}

export function processActionChoices(proc) {
  const choices = [
    { name: 'View Details', value: 'details' },
    { name: 'View Logs', value: 'logs' },
    { name: 'Environment', value: 'environment' },
    new Separator(),
  ];
  if (proc.status !== 'online') {
    choices.push({ name: theme.success('Start'), value: 'start' });
  }
  if (proc.status === 'online') {
    choices.push({ name: theme.warning('Stop'), value: 'stop' });
    choices.push({ name: 'Restart', value: 'restart' });
    choices.push({ name: 'Reload', value: 'reload' });
  }
  choices.push(new Separator());
  choices.push({ name: 'Reset', value: 'reset' });
  choices.push({ name: 'Open Working Directory', value: 'open-cwd' });
  choices.push({ name: theme.error('Delete'), value: 'delete' });
  choices.push(new Separator());
  choices.push(BACK_CHOICE);
  return choices;
}

export function logsMenuChoices() {
  return [
    { name: 'Select Process', value: 'process' },
    { name: 'All Processes', value: 'all' },
    new Separator(),
    { name: 'Error Logs', value: 'errors' },
    { name: 'Output Logs', value: 'output' },
    { name: 'Live Logs', value: 'live' },
    new Separator(),
    { name: 'Clear Logs', value: 'clear' },
    { name: 'Open Log Files', value: 'files' },
    new Separator(),
    BACK_CHOICE,
  ];
}

export function saveRestoreChoices() {
  return [
    { name: 'Save current processes', value: 'save' },
    { name: 'Restore saved processes', value: 'restore' },
    new Separator(),
    { name: 'Show saved configuration', value: 'show' },
    new Separator(),
    BACK_CHOICE,
  ];
}

export function startupChoices() {
  return [
    { name: 'Generate Startup Command', value: 'generate' },
    { name: 'Show Startup Status', value: 'status' },
    { name: 'Service Status', value: 'service' },
    new Separator(),
    { name: theme.warning('Disable Startup'), value: 'disable' },
    new Separator(),
    BACK_CHOICE,
  ];
}

export function ecosystemChoices() {
  return [
    { name: 'Detect ecosystem file', value: 'detect' },
    { name: 'Create ecosystem file', value: 'create' },
    new Separator(),
    { name: 'Start ecosystem', value: 'start' },
    { name: 'Reload ecosystem', value: 'reload' },
    { name: 'Stop ecosystem', value: 'stop' },
    new Separator(),
    { name: 'Edit ecosystem', value: 'edit' },
    { name: 'Validate ecosystem', value: 'validate' },
    new Separator(),
    BACK_CHOICE,
  ];
}

export function settingsChoices() {
  return [
    { name: 'Show configuration', value: 'show' },
    { name: 'Edit configuration', value: 'edit' },
    new Separator(),
    { name: theme.warning('Reset configuration'), value: 'reset' },
    new Separator(),
    BACK_CHOICE,
  ];
}

export function sortChoices() {
  return [
    { name: 'Name', value: 'name' },
    { name: 'ID', value: 'id' },
    { name: 'Status', value: 'status' },
    new Separator(),
    { name: 'CPU', value: '-cpu' },
    { name: 'Memory', value: '-memory' },
    { name: 'Uptime', value: '-uptime' },
    { name: 'Restarts', value: '-restarts' },
    { name: 'PID', value: 'pid' },
    new Separator(),
    BACK_CHOICE,
  ];
}
