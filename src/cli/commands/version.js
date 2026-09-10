import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPm2Version } from '../../pm2/daemon.js';
import { printJson } from '../output.js';
import { platformLabel } from '../../utils/platform.js';
import { theme } from '../../ui/colors.js';
import { panel } from '../../ui/boxes.js';
import { keyValue } from '../../ui/tables.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../package.json'), 'utf8'));

export function getOwnVersion() {
  return pkg.version;
}

export async function runVersion(options = {}) {
  const pm2 = await getPm2Version().catch(() => null);
  const data = {
    mindpm2: pkg.version,
    node: process.version,
    pm2,
    platform: `${platformLabel()}-${process.arch}`,
  };

  if (options.json) {
    printJson(data);
    return data;
  }

  process.stdout.write(
    `${panel(
      'MindPM2',
      keyValue([
        ['MindPM2', `v${data.mindpm2}`],
        ['Node.js', data.node],
        ['PM2', data.pm2 ? `v${data.pm2}` : theme.warning('not installed')],
        ['Platform', data.platform],
      ])
    )}\n`
  );
  return data;
}

export default runVersion;
