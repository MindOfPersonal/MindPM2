import boxen from 'boxen';
import { theme, progressLine, statusBadge, percent, palette, sparkline } from './colors.js';
import { padRight, visibleWidth, terminalWidth } from './screen.js';
import { formatBytes } from '../system/memory.js';
import { formatDuration } from './tables.js';
import { t } from '../i18n/index.js';

const BASE = {
  padding: { top: 0, bottom: 0, left: 1, right: 1 },
  margin: 0,
  borderStyle: 'round',
  borderColor: 'blue',
};

function clampWidth(content) {
  const limit = Math.max(30, terminalWidth() - 2);
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

function field(label, value, labelWidth = 12) {
  return `${theme.muted(padRight(label, labelWidth))}  ${value ?? theme.dim('-')}`;
}

function processStats(processes) {
  return {
    online: processes.filter((proc) => proc.status === 'online').length,
    stopped: processes.filter((proc) => ['stopped', 'stopped_gracefully'].includes(proc.status)).length,
    errored: processes.filter((proc) => proc.status === 'errored').length,
    total: processes.length,
  };
}

export function dashboardBox(data) {
  const stats = data.processes ?? processStats(data.rawProcesses ?? []);
  const lines = [];

  lines.push(field('PM2', data.pm2Version ?? theme.dim('not installed')));
  lines.push(field('Node', data.nodeVersion));
  lines.push(field('Platform', data.platform));
  lines.push(field('Hostname', data.hostname));
  lines.push(field('Uptime', data.system.uptime));

  lines.push('');
  lines.push(theme.primaryBold(t('monitor.processes')));
  lines.push(
    `  ${theme.success(`✔ ${stats.online} ${t('dashboard.online')}`)}   ` +
      `${theme.dim(`● ${stats.stopped} ${t('dashboard.stopped')}`)}   ` +
      `${theme.error(`✖ ${stats.errored} ${t('dashboard.errored')}`)}   ` +
      `${theme.muted(`${stats.total} ${t('dashboard.total')}`)}`
  );

  lines.push('');
  lines.push(theme.primaryBold(t('info.system')));
  lines.push(
    `  ${progressLine(t('info.cpu'), data.system.cpu, {
      width: 24,
      labelWidth: 8,
    })}`
  );
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

  return panel(t('screen.dashboard'), lines.join('\n'));
}

export function monitorBox(data) {
  const lines = [];
  lines.push(theme.primaryBold(t('info.system')));
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
  lines.push(theme.primaryBold(t('monitor.processes')));
  if (!data.processes || data.processes.length === 0) {
    lines.push(theme.dim(`  ${t('monitor.noProcesses')}`));
  } else {
    const nameWidth = Math.max(
      16,
      ...data.processes.map((proc) => visibleWidth(proc.name)),
      visibleWidth(t('table.name'))
    );
    const header =
      `  ${theme.muted(padRight(t('table.name').toUpperCase(), nameWidth))}  ` +
      `${theme.muted(padRight(t('table.status').toUpperCase(), 12))}  ` +
      `${theme.muted(t('table.cpu').toUpperCase().padStart(6))}  ` +
      `${theme.muted(t('table.memory').toUpperCase().padStart(9))}  ` +
      `${theme.muted(t('table.uptime').toUpperCase().padStart(8))}  ` +
      `${theme.muted(t('table.pid').toUpperCase().padStart(7))}`;
    lines.push(header);
    lines.push(`  ${theme.dim('─'.repeat(Math.max(20, visibleWidth(header) - 2)))}`);
    for (const proc of data.processes) {
      const status = statusBadge(proc.status);
      lines.push(
        `  ${padRight(theme.text(proc.name), nameWidth)}  ` +
          `${padRight(status, 12)}  ` +
          `${percent(proc.cpu, { decimals: 1 }).padStart(6)}  ` +
          `${formatBytes(proc.memory).padStart(9)}  ` +
          `${theme.muted(formatDuration(proc.uptime).padStart(8))}  ` +
          `${theme.muted(String(proc.pid || '-').padStart(7))}`
      );
    }
  }

  return panel(t('screen.monitor'), lines.join('\n'));
}

export { boxen, palette };
