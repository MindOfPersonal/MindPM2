import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getOwnVersion } from './version.js';
import { compareVersions } from '../../utils/version.js';
import { printSuccess, printWarning, printInfo, printJson } from '../output.js';
import { withSpinner } from '../../ui/spinner.js';
import { theme } from '../../ui/colors.js';

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
    latest = await withSpinner('Controleren op updates...', () => getLatestVersion(), {
      successText: 'Update-check voltooid.',
    });
  } catch (error) {
    printWarning('Kon niet controleren op updates (geen netwerk of niet gepubliceerd).');
    if (options.json) printJson({ current, latest: null, updateAvailable: false });
    return { current, latest: null, updateAvailable: false, error: error.message };
  }

  const updateAvailable = latest && compareVersions(latest, current) > 0;
  if (options.json) {
    printJson({ current, latest, updateAvailable });
    return { current, latest, updateAvailable };
  }

  if (updateAvailable) {
    printInfo(`Nieuwe versie beschikbaar: ${theme.accent(`v${latest}`)} (huidige: v${current})`);
    process.stdout.write(`\n${theme.muted('Update met:')}\n\n    npm install -g mindpm2\n`);
  } else {
    printSuccess(`MindPM2 is up-to-date (v${current}).`);
  }
  return { current, latest, updateAvailable };
}

export default runUpdate;
