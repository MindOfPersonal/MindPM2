import {
  generateStartupCommand,
  getStartupStatus,
  unstartup,
} from '../../pm2/startup.js';
import { getPlatformModule } from '../../system/platform/index.js';
import { printSuccess, printWarning, printInfo, printJson } from '../output.js';
import { confirmDangerous } from './helpers.js';
import { theme } from '../../ui/colors.js';
import { withSpinner } from '../../ui/spinner.js';
import { panel } from '../../ui/boxes.js';
import { keyValue } from '../../ui/tables.js';
import { isRoot } from '../../security/permissions.js';

export async function runStartup(options = {}) {
  const status = getStartupStatus();

  if (options.status) {
    if (options.json) {
      printJson(status);
      return status;
    }
    printStartupStatus(status);
    return status;
  }

  if (!status.supported) {
    printWarning('Startup management wordt niet ondersteund op dit platform.');
    return { supported: false };
  }

  if (options.disable) {
    const ok = await confirmDangerous('PM2 startup uitschakelen?', options);
    if (!ok) return { cancelled: true };
    const result = await withSpinner('PM2 startup uitschakelen...', () => unstartup(status.initSystem), {
      successText: 'PM2 startup uitgeschakeld (of commando gegenereerd).',
    });
    printOutput(result);
    return { disabled: true };
  }

  process.stdout.write(`${theme.muted('Gedetecteerd systeem:')} ${status.platform}\n`);
  process.stdout.write(`${theme.muted('Init systeem:')} ${status.initSystem}\n\n`);

  const ok = await confirmDangerous(
    'PM2 startup configuratie genereren?',
    { ...options, default: true }
  );
  if (!ok) return { cancelled: true };

  const { output, command } = await generateStartupCommand();
  printOutput({ stdout: output, stderr: '' });

  if (command) {
    process.stdout.write(
      `\n${theme.warning.bold('Voer dit commando uit met verhoogde rechten:')}\n\n  ${theme.accent(command)}\n`
    );
    if (isRoot()) {
      printInfo('MindPM2 voert sudo-commando\'s nooit automatisch uit.');
    }
  }

  if (options.json) {
    return { command, output };
  }
  return { command, output };
}

function printStartupStatus(status) {
  process.stdout.write(
    `${panel(
      'Startup Status',
      keyValue([
        ['Status', status.enabled ? theme.success('enabled') : theme.warning('disabled')],
        ['Platform', status.platform],
        ['Init system', status.initSystem],
        ['Service', status.serviceName ?? '-'],
        ['User', status.user],
      ])
    )}\n`
  );
}

function printOutput(result) {
  const text = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  if (text) process.stdout.write(`\n${text}\n`);
}

export default runStartup;
