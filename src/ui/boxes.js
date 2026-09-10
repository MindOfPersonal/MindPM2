import boxen from 'boxen';
import { theme, progressLine, statusBadge, percent, palette } from './colors.js';
import { padRight, visibleWidth, terminalWidth } from './screen.js';
import { formatBytes } from '../system/memory.js';
import { formatDuration } from './tables.js';

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
  lines.push(theme.primaryBold('Processes'));
  lines.push(
    `  ${theme.success(`✔ ${stats.online} online`)}   ` +
      `${theme.dim(`● ${stats.stopped} stopped`)}   ` +
      `${theme.error(`✖ ${stats.errored} errored`)}   ` +
      `${theme.muted(`${stats.total} total`)}`
  );

  lines.push('');
  lines.push(theme.primaryBold('System'));
  lines.push(
    `  ${progressLine('CPU', data.system.cpu, {
      width: 24,
      labelWidth: 8,
    })}`
  );
  lines.push(
    `  ${progressLine('Memory', data.system.memoryPercent, {
      width: 24,
      labelWidth: 8,
      suffix: `${data.system.memoryUsed} / ${data.system.memoryTotal}`,
    })}`
  );
  if (data.system.diskPercent !== undefined && data.system.diskPercent !== null) {
    lines.push(
      `  ${progressLine('Disk', data.system.diskPercent, {
        width: 24,
        labelWidth: 8,
        suffix: data.system.diskSuffix ?? '',
      })}`
    );
  }

  return panel('MindPM2 Dashboard', lines.join('\n'));
}

export function monitorBox(data) {
  const lines = [];
  lines.push(theme.primaryBold('System'));
  lines.push(`  ${progressLine('CPU', data.cpu, { width: 28, labelWidth: 8 })}`);
  lines.push(
    `  ${progressLine('Memory', data.memory.percent, {
      width: 28,
      labelWidth: 8,
      suffix: `${data.memory.usedFormatted} / ${data.memory.totalFormatted}`,
    })}`
  );
  if (data.disk) {
    lines.push(
      `  ${progressLine('Disk', data.disk.percent, {
        width: 28,
        labelWidth: 8,
        suffix: `${data.disk.usedFormatted} / ${data.disk.totalFormatted}`,
      })}`
    );
  }
  if (data.load) {
    lines.push(
      `  ${theme.muted('Load'.padEnd(8))}  ${theme.text(
        `${data.load.one.toFixed(2)} ${data.load.five.toFixed(2)} ${data.load.fifteen.toFixed(2)}`
      )}`
    );
  }

  lines.push('');
  lines.push(theme.primaryBold('Processes'));
  if (!data.processes || data.processes.length === 0) {
    lines.push(theme.dim('  Geen processen.'));
  } else {
    const nameWidth = Math.max(
      16,
      ...data.processes.map((proc) => visibleWidth(proc.name)),
      visibleWidth('NAME')
    );
    const header =
      `  ${theme.muted(padRight('NAME', nameWidth))}  ` +
      `${theme.muted(padRight('STATUS', 12))}  ` +
      `${theme.muted('CPU'.padStart(6))}  ` +
      `${theme.muted('MEMORY'.padStart(9))}  ` +
      `${theme.muted('UPTIME'.padStart(8))}  ` +
      `${theme.muted('PID'.padStart(7))}`;
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

  return panel('MindPM2 Monitor', lines.join('\n'));
}

export { boxen, palette };
