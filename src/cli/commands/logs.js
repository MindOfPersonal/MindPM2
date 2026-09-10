import {
  readProcessLogs,
  readAllLogs,
  flushLogs,
  reloadLogs,
  listLogFiles,
  streamLogsToConsole,
} from '../../pm2/logs.js';
import { printJson, printSuccess, printInfo } from '../output.js';
import { theme } from '../../ui/colors.js';
import { confirmDangerous } from './helpers.js';
import { loadConfig } from '../../config/manager.js';
import { t } from '../../i18n/index.js';

function renderLines(lines, color) {
  return lines.map((line) => color(line)).join('\n');
}

export async function runLogs(target, options = {}) {
  if (options.files) {
    const files = listLogFiles();
    if (options.json) {
      printJson({ files });
      return files;
    }
    if (files.length === 0) {
      printInfo(t('logs.none'));
    } else {
      process.stdout.write(`${files.map((file) => theme.muted(file)).join('\n')}\n`);
    }
    return files;
  }

  if (options.clear) {
    const message = target
      ? t('logs.confirmClear', { name: target })
      : t('logs.confirmClearAll');
    const ok = await confirmDangerous(message, options);
    if (!ok) return { cancelled: true };
    if (target) {
      await flushLogs(target);
      printSuccess(t('logs.cleared', { name: target }));
    } else {
      await flushLogs();
      printSuccess(t('logs.clearedAll'));
    }
    return { cleared: true };
  }

  if (options.reload) {
    await reloadLogs();
    printSuccess(t('logs.reloaded'));
    return { reloaded: true };
  }

  if (options.live) {
    printInfo(t('logs.liveStarted'));
    await streamLogsToConsole(target, {
      lines: options.lines ?? loadConfig().logLines ?? 15,
      errOnly: options.err,
      outOnly: options.out,
    });
    return { streamed: true };
  }

  const lines = options.lines ?? loadConfig().logLines ?? 50;

  if (target) {
    const { process: proc, out, err } = await readProcessLogs(target, { lines });
    if (options.json) {
      printJson({ process: proc.name, out, err });
      return { process: proc.name, out, err };
    }
    process.stdout.write(`${theme.primaryBold(t('logs.title', { name: proc.name }))}\n\n`);
    if (!options.err && out.length > 0) {
      process.stdout.write(`${theme.muted(`— ${t('logs.output')} —`)}\n${renderLines(out, theme.text)}\n`);
    }
    if (!options.out && err.length > 0) {
      process.stdout.write(`${theme.error(`— ${t('logs.errors')} —`)}\n${renderLines(err, theme.error)}\n`);
    }
    if (out.length === 0 && err.length === 0) {
      printInfo(t('logs.noLines'));
    }
    return { process: proc.name, out, err };
  }

  const all = await readAllLogs(lines);
  if (options.json) {
    printJson({
      processes: all.map((entry) => ({ process: entry.process.name, out: entry.out, err: entry.err })),
    });
    return all;
  }
  for (const entry of all) {
    const total = entry.out.length + entry.err.length;
    process.stdout.write(
      `${theme.primaryBold(entry.process.name)} ${theme.muted(`(${t('logs.lines', { count: total })})`)}\n`
    );
    if (entry.out.length > 0 && !options.err) {
      process.stdout.write(`${renderLines(entry.out, theme.text)}\n`);
    }
    if (entry.err.length > 0 && !options.out) {
      process.stdout.write(`${renderLines(entry.err, theme.error)}\n`);
    }
    process.stdout.write('\n');
  }
  return all;
}

export default runLogs;
