import boxen from 'boxen';
import {
  theme,
  progressLine,
  statusBadge,
  percent,
  palette,
  sparkline,
} from './colors.js';
import { visibleWidth, terminalWidth, statusBar } from './screen.js';
import { formatBytes } from '../system/memory.js';
import { formatDuration, truncate, renderTable } from './tables.js';
import { t } from '../i18n/index.js';

const BASE = {
  padding: { top: 0, bottom: 0, left: 1, right: 1 },
  margin: { top: 0, bottom: 0, left: 2, right: 0 },
  borderStyle: 'round',
  borderColor: palette.dim,
};

function clampWidth(content) {
  const limit = Math.max(30, terminalWidth() - 4);
  const longest = Math.max(...String(content).split('\n').map((line) => visibleWidth(line)), 0);
  const outer = longest + 2 + 2; // padding + border
  return outer > limit ? Math.max(20, limit - 4) : undefined;
}

export function panel(title, content, options = {}) {
  const width = options.width ?? clampWidth(content);
  return boxen(content, {
    ...BASE,
    title: title ? ` ${title} ` : undefined,
    titleAlignment: options.titleAlignment ?? 'left',
    ...(width ? { width } : {}),
    ...options,
  });
}

function titled(title, content, options) {
  return panel(title, `\n${content}\n`, options);
}

export function successPanel(content, options = {}) {
  return panel(options.title, `${theme.success(content)}`, { borderColor: 'green', ...options });
}

export function warningPanel(content, options = {}) {
  return panel(options.title, `${theme.warning(content)}`, { borderColor: 'yellow', ...options });
}

export function errorPanel(content, options = {}) {
  return panel(options.title, `${theme.error(content)}`, { borderColor: 'red', ...options });
}

export function infoPanel(title, content, options = {}) {
  return panel(title, content, options);
}

function processStats(processes) {
  return {
    online: processes.filter((proc) => proc.status === 'online').length,
    stopped: processes.filter((proc) => ['stopped', 'stopped_gracefully'].includes(proc.status)).length,
    errored: processes.filter((proc) => proc.status === 'errored').length,
    total: processes.length,
  };
}

function chip(label, value) {
  return `${theme.muted(label)} ${theme.text(value)}`;
}

export function dashboardBox(data) {
  const stats = data.processes ?? processStats(data.rawProcesses ?? []);
  const lines = [];

  lines.push(
    `  ${chip('PM2', data.pm2Version ?? t('info.notInstalled'))}   ${chip(
      'Node',
      data.nodeVersion
    )}   ${chip('OS', data.platform)}`
  );
  lines.push(
    `  ${theme.muted(data.hostname)}   ${theme.dim('•')}   ${theme.muted(
      `${t('info.uptime')} ${data.system.uptime}`
    )}`
  );

  lines.push('');
  lines.push(`  ${theme.primaryBold(t('monitor.processes'))}`);
  lines.push(`  ${statusBar(stats)}`);

  lines.push('');
  lines.push(`  ${theme.primaryBold(t('info.system'))}`);
  lines.push(`  ${progressLine(t('info.cpu'), data.system.cpu, { width: 24, labelWidth: 8 })}`);
  lines.push(
    `  ${progressLine(t('info.memory'), data.system.memoryPercent, {
      width: 24,
      labelWidth: 8,
      suffix: `${data.system.memoryUsed} / ${data.system.memoryTotal}`,
    })}`
  );
  if (data.system.diskPercent !== undefined && data.system.diskPercent !== null) {
    lines.push(
      `  ${progressLine(t('info.disk'), data.system.diskPercent, {
        width: 24,
        labelWidth: 8,
        suffix: data.system.diskSuffix ?? '',
      })}`
    );
  }

  return titled(t('screen.dashboard'), lines.join('\n'));
}

function monitorProcessTable(processes) {
  const headers = [
    t('table.name'),
    t('table.status'),
    t('table.cpu'),
    t('table.memory'),
    t('table.uptime'),
    t('table.pid'),
  ].map((label) => label.toUpperCase());
  const rows = processes.map((proc) => [
    theme.text(truncate(proc.name, 24)),
    statusBadge(proc.status),
    percent(proc.cpu, { decimals: 1 }),
    theme.text(formatBytes(proc.memory)),
    theme.muted(formatDuration(proc.uptime)),
    proc.pid ? theme.text(String(proc.pid)) : theme.dim('-'),
  ]);
  return renderTable({
    headers,
    rows,
    aligns: ['left', 'left', 'right', 'right', 'right', 'right'],
  });
}

export function monitorBox(data) {
  const lines = [];
  lines.push(`  ${theme.primaryBold(t('info.system'))}`);
  lines.push(`  ${progressLine(t('info.cpu'), data.cpu, { width: 28, labelWidth: 8 })}`);
  if (Array.isArray(data.history) && data.history.length > 1) {
    lines.push(`  ${theme.muted(t('monitor.history').padEnd(8))}  ${sparkline(data.history)}`);
  }
  lines.push(
    `  ${progressLine(t('info.memory'), data.memory.percent, {
      width: 28,
      labelWidth: 8,
      suffix: `${data.memory.usedFormatted} / ${data.memory.totalFormatted}`,
    })}`
  );
  if (data.disk) {
    lines.push(
      `  ${progressLine(t('info.disk'), data.disk.percent, {
        width: 28,
        labelWidth: 8,
        suffix: `${data.disk.usedFormatted} / ${data.disk.totalFormatted}`,
      })}`
    );
  }
  if (data.load) {
    lines.push(
      `  ${theme.muted(t('monitor.load').padEnd(8))}  ${theme.text(
        `${data.load.one.toFixed(2)} ${data.load.five.toFixed(2)} ${data.load.fifteen.toFixed(2)}`
      )}`
    );
  }

  lines.push('');
  lines.push(`  ${theme.primaryBold(t('monitor.processes'))}`);
  if (!data.processes || data.processes.length === 0) {
    lines.push(`  ${theme.dim(t('monitor.noProcesses'))}`);
  } else {
    lines.push(monitorProcessTable(data.processes));
  }

  return titled(t('screen.monitor'), lines.join('\n'));
}

export { boxen, palette };
