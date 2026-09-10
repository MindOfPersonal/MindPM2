import { theme, ICONS } from './colors.js';

// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

export const INDENT = 2;

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

export function brand() {
  return `${theme.primary(ICONS.brand)} ${theme.primaryBold('MindPM2')}`;
}

export function header(title, subtitle) {
  const lines = [
    `${' '.repeat(INDENT)}${brand()} ${theme.dim(ICONS.chevron)} ${theme.title(title)}`,
  ];
  if (subtitle) lines.push(`${' '.repeat(INDENT)}${subtitle}`);
  lines.push(
    `${' '.repeat(INDENT)}${theme.dim('─'.repeat(Math.max(0, terminalWidth() - INDENT * 2)))}`
  );
  return lines.join('\n');
}

export function section(title) {
  return `\n${theme.primaryBold(title)}`;
}

export function hint(text) {
  return theme.dim(text);
}

export function dotSeparator(items) {
  return items.filter(Boolean).join(theme.dim(` ${ICONS.middot} `));
}

export function statusBar({ online = 0, stopped = 0, errored = 0, total = 0 } = {}) {
  return [
    theme.success(`${ICONS.dotOnline} ${online} online`),
    theme.dim(`${ICONS.dotStopped} ${stopped} stopped`),
    theme.error(`${ICONS.dotError} ${errored} errored`),
    theme.muted(`${total} total`),
  ].join(theme.dim(`   ${ICONS.middot}   `));
}

export function padRight(value, width) {
  const diff = width - visibleWidth(value);
  return diff > 0 ? `${value}${' '.repeat(diff)}` : value;
}

export function padLeft(value, width) {
  const diff = width - visibleWidth(value);
  return diff > 0 ? `${' '.repeat(diff)}${value}` : value;
}
