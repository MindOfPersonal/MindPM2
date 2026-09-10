import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { theme, palette, chalk } from './colors.js';
import { center, terminalWidth } from './screen.js';
import { loadConfig } from '../config/manager.js';
import { platformLabel } from '../utils/platform.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, '../../assets/logo.txt');
const PKG_PATH = path.resolve(__dirname, '../../package.json');

const FALLBACK_LOGO = [
  '███╗   ███╗██╗███╗   ██╗██████╗ ██████╗ ███╗   ███╗██████╗',
  '████╗ ████║██║████╗  ██║██╔══██╗██╔══██╗████╗ ████║╚════██╗',
  '██╔████╔██║██║██╔██╗ ██║██║  ██║██████╔╝██╔████╔██║ █████╔╝',
  '██║╚██╔╝██║██║██║╚██╗██║██║  ██║██╔═══╝ ██║╚██╔╝██║██╔═══╝',
  '██║ ╚═╝ ██║██║██║ ╚████║██████╔╝██║     ██║ ╚═╝ ██║███████╗',
  '╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝     ╚═╝     ╚═╝╚══════╝',
];

function readPackageVersion() {
  try {
    return JSON.parse(fs.readFileSync(PKG_PATH, 'utf8')).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export function getLogoLines() {
  try {
    if (fs.existsSync(LOGO_PATH)) {
      return fs
        .readFileSync(LOGO_PATH, 'utf8')
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => line.replace(/\s+$/, ''))
        .filter((line) => line.length > 0);
    }
  } catch {
    /* ignore */
  }
  return FALLBACK_LOGO;
}

export function getLogo() {
  return getLogoLines().join('\n');
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function gradientColor(index, total) {
  const from = hexToRgb(palette.primarySoft);
  const to = hexToRgb(palette.purple);
  const t = total <= 1 ? 0 : index / (total - 1);
  const rgb = [lerp(from.r, to.r, t), lerp(from.g, to.g, t), lerp(from.b, to.b, t)];
  return `#${rgb.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

export function renderLogo(options = {}) {
  const lines = options.lines ?? getLogoLines();
  const total = lines.length;
  const width = Math.max(...lines.map((line) => [...line].length));
  const targetWidth = options.width ?? terminalWidth();
  return lines
    .map((line, index) => {
      const padded = line.padEnd(width, ' ');
      return center(chalk.hex(gradientColor(index, total))(padded), targetWidth);
    })
    .join('\n');
}

export function renderBanner(options = {}) {
  const version = options.version ?? readPackageVersion();
  const width = options.width ?? terminalWidth();
  const tagline =
    options.tagline ??
    `${theme.muted('Advanced')} ${theme.accent('PM2')} ${theme.muted('Management CLI')}`;
  const meta =
    options.meta ??
    [
      theme.muted(`v${version}`),
      theme.muted(`Node ${process.version}`),
      theme.muted(platformLabel()),
    ].join(theme.dim('  •  '));

  return ['', renderLogo(options), '', center(tagline, width), center(meta, width), ''].join('\n');
}

export function showLogo(options = {}) {
  const config = options.config ?? loadConfig();
  if (!config.showLogo) return;
  const stream = options.stream ?? process.stdout;
  stream.write(`${renderBanner(options)}\n`);
}

export function showBanner(options = {}) {
  return showLogo(options);
}
