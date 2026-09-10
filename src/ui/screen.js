import { theme } from './colors.js';

// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

export function stripAnsi(value) {
  return String(value).replace(ANSI_PATTERN, '');
}

export function visibleWidth(value) {
  return [...stripAnsi(value)].length;
}

export function terminalWidth(fallback = 80) {
  return process.stdout.columns && process.stdout.columns > 20
    ? process.stdout.columns
    : fallback;
}

export function center(text, width = terminalWidth()) {
  const pad = Math.max(0, Math.floor((width - visibleWidth(text)) / 2));
  return `${' '.repeat(pad)}${text}`;
}

export function divider(width = terminalWidth(), char = '─') {
  return theme.dim(char.repeat(Math.max(0, width)));
}

export function header(title, subtitle) {
  const lines = [
    `${theme.primaryBold('MindPM2')} ${theme.dim('›')} ${theme.title(title)}`,
  ];
  if (subtitle) lines.push(theme.muted(subtitle));
  lines.push(divider());
  return lines.join('\n');
}

export function section(title) {
  return `\n${theme.primaryBold(title)}`;
}

export function hint(text) {
  return theme.dim(text);
}

export function dotSeparator(items) {
  return items.filter(Boolean).join(theme.dim('  •  '));
}

export function padRight(value, width) {
  const diff = width - visibleWidth(value);
  return diff > 0 ? `${value}${' '.repeat(diff)}` : value;
}

export function padLeft(value, width) {
  const diff = width - visibleWidth(value);
  return diff > 0 ? `${' '.repeat(diff)}${value}` : value;
}
