import chalk from 'chalk';
import { loadConfig } from '../config/manager.js';
import { getThemeDefinition } from './themes.js';

function detectThemeName() {
  try {
    return loadConfig().theme ?? 'default';
  } catch {
    return 'default';
  }
}

function buildTheme(p) {
  return {
    primary: chalk.hex(p.primary),
    primaryBold: chalk.hex(p.primary).bold,
    primarySoft: chalk.hex(p.primarySoft),
    accent: chalk.hex(p.accent),
    accentBold: chalk.hex(p.accent).bold,
    success: chalk.hex(p.success),
    successBold: chalk.hex(p.success).bold,
    warning: chalk.hex(p.warning),
    warningBold: chalk.hex(p.warning).bold,
    error: chalk.hex(p.error),
    errorBold: chalk.hex(p.error).bold,
    info: chalk.hex(p.info),
    purple: chalk.hex(p.purple),
    muted: chalk.hex(p.muted),
    dim: chalk.hex(p.dim),
    text: chalk.hex(p.text),
    title: chalk.hex(p.white).bold,
    bold: chalk.bold,
    italic: chalk.italic,
  };
}

export let activeTheme = detectThemeName();
let definition = getThemeDefinition(activeTheme);
export const palette = { ...definition.palette };
export const theme = buildTheme(palette);
export let BORDER = definition.border;

export function reloadTheme(name) {
  const next = getThemeDefinition(name);
  activeTheme = name;
  definition = next;
  BORDER = next.border;
  Object.assign(palette, next.palette);
  const rebuilt = buildTheme(palette);
  for (const key of Object.keys(theme)) delete theme[key];
  Object.assign(theme, rebuilt);
  return theme;
}
export const BORDER_SUCCESS = 'green';
export const BORDER_WARNING = 'yellow';
export const BORDER_ERROR = 'red';

export const ICONS = {
  ok: '✔',
  fail: '✖',
  warn: '⚠',
  info: 'ℹ',
  bullet: '•',
  middot: '·',
  arrow: '›',
  chevron: '›',
  pointer: '❯',
  brand: '◆',
  dot: '●',
  dotOnline: '●',
  dotStopped: '○',
  dotError: '✖',
  clock: '◐',
  spark: '✦',
};

export const STATUS_META = {
  online: { icon: ICONS.dotOnline, color: theme.success, label: 'online' },
  stopped: { icon: ICONS.dotStopped, color: theme.dim, label: 'stopped' },
  stopped_gracefully: { icon: ICONS.dotStopped, color: theme.dim, label: 'stopped' },
  errored: { icon: ICONS.dotError, color: theme.error, label: 'errored' },
  launching: { icon: ICONS.clock, color: theme.accent, label: 'launching' },
  'one-launch-status': { icon: ICONS.clock, color: theme.accent, label: 'launching' },
  'waiting restart': { icon: ICONS.warn, color: theme.warning, label: 'waiting' },
  'online*': { icon: ICONS.warn, color: theme.warning, label: 'unstable' },
  unstable: { icon: ICONS.warn, color: theme.warning, label: 'unstable' },
  deleting: { icon: ICONS.dot, color: theme.error, label: 'deleting' },
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
