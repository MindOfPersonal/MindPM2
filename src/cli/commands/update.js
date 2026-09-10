import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getOwnVersion } from './version.js';
import { compareVersions } from '../../utils/version.js';
import { printSuccess, printWarning, printInfo, printJson } from '../output.js';
import { withSpinner } from '../../ui/spinner.js';
import { theme } from '../../ui/colors.js';
import { t } from '../../i18n/index.js';

const execFileAsync = promisify(execFile);

export async function getLatestVersion() {
  const { stdout } = await execFileAsync('npm', ['view', 'mindpm2', 'version'], {
    encoding: 'utf8',
    timeout: 20000,
  });
  return stdout.trim().replace(/^v/i, '');
}

export async function runUpdate(options = {}) {
  const current = getOwnVersion();
  let latest;
  try {
    latest = await withSpinner(t('update.checking'), () => getLatestVersion(), {
      successText: t('update.checkDone'),
    });
  } catch (error) {
    printWarning(t('update.noNetwork'));
    if (options.json) printJson({ current, latest: null, updateAvailable: false });
    return { current, latest: null, updateAvailable: false, error: error.message };
  }

  const updateAvailable = latest && compareVersions(latest, current) > 0;
  if (options.json) {
    printJson({ current, latest, updateAvailable });
    return { current, latest, updateAvailable };
  }

  if (updateAvailable) {
    printInfo(t('update.available', { latest: theme.accent(`v${latest}`), current: `v${current}` }));
    process.stdout.write(`\n${theme.muted(t('update.howTo'))}\n\n    npm install -g mindpm2\n`);
  } else {
    printSuccess(t('update.upToDate', { version: current }));
  }
  return { current, latest, updateAvailable };
}

export default runUpdate;
