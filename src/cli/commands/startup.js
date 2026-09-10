import {
  generateStartupCommand,
  getStartupStatus,
  unstartup,
} from '../../pm2/startup.js';
import { printWarning, printInfo, printJson } from '../output.js';
import { confirmDangerous } from './helpers.js';
import { theme } from '../../ui/colors.js';
import { withSpinner } from '../../ui/spinner.js';
import { panel } from '../../ui/boxes.js';
import { keyValue } from '../../ui/tables.js';
import { isRoot } from '../../security/permissions.js';
import { t } from '../../i18n/index.js';

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
    printWarning(t('startup.notSupported'));
    return { supported: false };
  }

  if (options.disable) {
    const ok = await confirmDangerous(t('startup.confirmDisable'), options);
    if (!ok) return { cancelled: true };
    const result = await withSpinner(t('startup.disabling'), () => unstartup(status.initSystem), {
      successText: t('startup.disabledDone'),
    });
    printOutput(result);
    return { disabled: true };
  }

  process.stdout.write(`${theme.muted(t('startup.detectedSystem'))} ${status.platform}\n`);
  process.stdout.write(`${theme.muted(t('startup.detectedInit'))} ${status.initSystem}\n\n`);

  const ok = await confirmDangerous(t('startup.confirmGenerate'), { ...options, default: true });
  if (!ok) return { cancelled: true };

  const { output, command } = await generateStartupCommand();
  printOutput({ stdout: output, stderr: '' });

  if (command) {
    process.stdout.write(
      `\n${theme.warning.bold(t('startup.elevated'))}\n\n  ${theme.accent(command)}\n`
    );
    if (isRoot()) {
      printInfo(t('startup.noAutoSudo'));
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
      t('startup.status'),
      keyValue([
        [t('startup.status'), status.enabled ? theme.success(t('startup.enabled')) : theme.warning(t('startup.disabled'))],
        [t('startup.platform'), status.platform],
        [t('startup.initSystem'), status.initSystem],
        [t('startup.service'), status.serviceName ?? '-'],
        [t('startup.user'), status.user],
      ])
    )}\n`
  );
}

function printOutput(result) {
  const text = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  if (text) process.stdout.write(`\n${text}\n`);
}

export default runStartup;
