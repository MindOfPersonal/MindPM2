import chalk from 'chalk';
import { loadConfig } from '../config/manager.js';
import { getThemeDefinition } from './themes.js';

const activeThemeName = (() => {
  try {
    return loadConfig().theme ?? 'default';
  } catch {
    return 'default';
  }
})();

const definition = getThemeDefinition(activeThemeName);
export const palette = definition.palette;
export const activeTheme = activeThemeName;

export const theme = {
  primary: chalk.hex(palette.primary),
  primaryBold: chalk.hex(palette.primary).bold,
  primarySoft: chalk.hex(palette.primarySoft),
  accent: chalk.hex(palette.accent),
  accentBold: chalk.hex(palette.accent).bold,
  success: chalk.hex(palette.success),
  successBold: chalk.hex(palette.success).bold,
  warning: chalk.hex(palette.warning),
  warningBold: chalk.hex(palette.warning).bold,
  error: chalk.hex(palette.error),
  errorBold: chalk.hex(palette.error).bold,
  info: chalk.hex(palette.info),
  purple: chalk.hex(palette.purple),
  muted: chalk.hex(palette.muted),
  dim: chalk.hex(palette.dim),
  text: chalk.hex(palette.text),
  title: chalk.hex(palette.white).bold,
  bold: chalk.bold,
  italic: chalk.italic,
};

export const BORDER = definition.border;
export const BORDER_SUCCESS = 'green';
export const BORDER_WARNING = 'yellow';
export const BORDER_ERROR = 'red';

export const ICONS = {
  ok: '✔',
  fail: '✖',
  warn: '⚠',
  info: 'ℹ',
  bullet: '•',
  arrow: '›',
  pointer: '❯',
  dot: '●',
  clock: '◐',
  spark: '✦',
};

export const STATUS_META = {
  online: { icon: '✔', color: theme.success, label: 'online' },
  stopped: { icon: '●', color: theme.dim, label: 'stopped' },
  stopped_gracefully: { icon: '●', color: theme.dim, label: 'stopped' },
  errored: { icon: '✖', color: theme.error, label: 'errored' },
  launching: { icon: '◐', color: theme.accent, label: 'launching' },
  'one-launch-status': { icon: '◐', color: theme.accent, label: 'launching' },
  'waiting restart': { icon: '⚠', color: theme.warning, label: 'waiting' },
  'online*': { icon: '⚠', color: theme.warning, label: 'unstable' },
  unstable: { icon: '⚠', color: theme.warning, label: 'unstable' },
  deleting: { icon: '●', color: theme.error, label: 'deleting' },
  unknown: { icon: '?', color: theme.dim, label: 'unknown' },
};

export function statusMeta(status) {
  return STATUS_META[String(status).toLowerCase()] ?? STATUS_META.unknown;
}

export function statusBadge(status) {
  const meta = statusMeta(status);
  return meta.color(`${meta.icon} ${meta.label}`);
}

export function statusDot(status) {
  const meta = statusMeta(status);
  return meta.color(meta.icon);
}

export function colorByStatus(status, value) {
  return statusMeta(status).color(String(value));
}

export function meter(value) {
  const number = Math.max(0, Math.min(100, Number(value) || 0));
  if (number >= 90) return theme.error;
  if (number >= 70) return theme.warning;
  return theme.success;
}

export function percent(value, options = {}) {
  const number = Number(value) || 0;
  const text = `${number.toFixed(options.decimals ?? 1)}%`;
  return meter(number)(text);
}

export function progressBar(value, width = 24, options = {}) {
  const number = Math.max(0, Math.min(100, Number(value) || 0));
  const count = Math.round((number / 100) * width);
  const filled = (options.filled ?? '█').repeat(count);
  const empty = (options.empty ?? '░').repeat(Math.max(0, width - count));
  const color = options.color ?? meter(number);
  return `${color(filled)}${theme.dim(empty)}`;
}

export function progressLine(label, value, options = {}) {
  const width = options.width ?? 24;
  const labelWidth = options.labelWidth ?? 8;
  const suffix = options.suffix ? `  ${theme.muted(options.suffix)}` : '';
  return `${theme.muted(String(label).padEnd(labelWidth))}${progressBar(value, width)} ${percent(value)}${suffix}`;
}

export function sparkline(values, options = {}) {
  const ticks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const data = (values ?? []).filter((value) => Number.isFinite(Number(value)));
  if (data.length === 0) return theme.dim('—');
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const chars = data.map((value) => {
    const index = Math.round(((Number(value) - min) / range) * (ticks.length - 1));
    return ticks[index];
  });
  const color = options.color ?? theme.primarySoft;
  return color(chars.join(''));
}

export function badge(text, color = theme.primary) {
  return color(` ${text} `);
}

export function heading(text) {
  return theme.primaryBold(text);
}

export { chalk };
