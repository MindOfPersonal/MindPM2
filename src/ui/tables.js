import { theme, statusBadge, percent, ICONS } from './colors.js';
import { formatBytes } from '../system/memory.js';
import { visibleWidth, padLeft, padRight, stripAnsi } from './screen.js';
import { t } from '../i18n/index.js';

export function formatDuration(ms) {
  const total = Math.floor((Number(ms) || 0) / 1000);
  if (total <= 0) return '-';
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value) => String(value).padStart(2, '0');
  if (days > 0) return `${days}d ${pad(hours)}h`;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatCpu(value) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

export function truncate(value, max) {
  const text = String(value ?? '');
  if (visibleWidth(text) <= max) return text;
  return `${stripAnsi(text).slice(0, Math.max(0, max - 1))}…`;
}

export function renderTable({ headers, rows, aligns = [], gap = 2, indent = 2 }) {
  const widths = headers.map((header, index) =>
    Math.max(
      visibleWidth(header),
      ...rows.map((row) => visibleWidth(row[index] ?? ''))
    )
  );
  const align = (value, index) =>
    aligns[index] === 'right' ? padLeft(value ?? '', widths[index]) : padRight(value ?? '', widths[index]);

  const contentWidth = widths.reduce((sum, width) => sum + width, 0) + gap * (headers.length - 1);
  const pad = ' '.repeat(indent);
  const headerLine = headers.map((header, index) => theme.muted(align(header, index))).join(' '.repeat(gap));
  const dividerLine = theme.dim('─'.repeat(Math.max(0, contentWidth)));
  const bodyLines = rows.map(
    (row) => `${pad}${row.map((cell, index) => align(cell, index)).join(' '.repeat(gap))}`
  );

  return [`${pad}${headerLine}`, `${pad}${dividerLine}`, ...bodyLines].join('\n');
}

function nameColumnWidth(processes) {
  const longest = processes.reduce((max, proc) => Math.max(max, visibleWidth(proc.name)), 0);
  return Math.min(30, Math.max(14, longest));
}

export function processTable(processes, options = {}) {
  const nameWidth = options.nameWidth ?? nameColumnWidth(processes);
  const headers = [
    t('table.id'),
    t('table.name'),
    t('table.mode'),
    t('table.status'),
    t('table.cpu'),
    t('table.memory'),
    t('table.restarts'),
    t('table.uptime'),
    t('table.pid'),
  ].map((label) => label.toUpperCase());

  const rows = processes.map((proc) => [
    theme.muted(String(proc.id).padStart(2)),
    theme.text(truncate(proc.name, nameWidth)),
    theme.dim(proc.mode),
    statusBadge(proc.status),
    percent(proc.cpu, { decimals: 1 }),
    theme.text(formatBytes(proc.memory)),
    proc.restartTime > 0 ? theme.warning(String(proc.restartTime)) : theme.dim('0'),
    theme.muted(formatDuration(proc.uptime)),
    proc.pid ? theme.text(String(proc.pid)) : theme.dim('-'),
  ]);

  if (processes.length === 0 && !options.hideEmpty) {
    return `  ${theme.dim(`${ICONS.bullet} ${t('list.empty')}`)}`;
  }

  return renderTable({
    headers,
    rows,
    aligns: ['right', 'left', 'left', 'left', 'right', 'right', 'right', 'right', 'right'],
  });
}

export function keyValue(rows, options = {}) {
  const labelWidth =
    options.labelWidth ?? Math.max(...rows.map(([label]) => visibleWidth(String(label))), 0);
  return rows
    .map(([label, value]) => {
      if (label === '') return '';
      return `  ${theme.muted(padRight(String(label), labelWidth))}  ${value ?? theme.dim('-')}`;
    })
    .join('\n');
}

export function twoColumnTable(pairs) {
  return keyValue(pairs, { labelWidth: 20 });
}
