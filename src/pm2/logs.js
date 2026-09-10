import fs from 'node:fs';
import { spawnPm2, execPm2 } from './daemon.js';
import { findProcess } from './processes.js';
import { validateProcessIdentifier } from '../security/validator.js';
import { getPm2LogsDir } from '../utils/paths.js';

export function getLogPaths(process) {
  return {
    out: process?.outLogPath ?? null,
    err: process?.errLogPath ?? null,
    combined: process?.combinedLogPath ?? null,
  };
}

export function readLastLines(filePath, lineCount = 50) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  const maxBytes = 512 * 1024;
  const stat = fs.statSync(filePath);
  const start = Math.max(0, stat.size - maxBytes);
  const length = stat.size - start;
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, start);
    const text = buffer.toString('utf8');
    const lines = text.split(/\r?\n/);
    if (start > 0) lines.shift();
    return lines.filter((line) => line.length > 0).slice(-lineCount);
  } finally {
    fs.closeSync(fd);
  }
}

export async function readProcessLogs(identifier, options = {}) {
  const lines = options.lines ?? 50;
  const process = await findProcess(identifier);
  const paths = getLogPaths(process);
  return {
    process,
    out: readLastLines(paths.out ?? paths.combined, lines),
    err: readLastLines(paths.err, lines),
  };
}

export async function readAllLogs(lineCount = 50) {
  const processes = await import('./processes.js').then((mod) => mod.listProcesses());
  return processes.map((process) => ({
    process,
    out: readLastLines(process.outLogPath ?? process.combinedLogPath, lineCount),
    err: readLastLines(process.errLogPath, lineCount),
  }));
}

export function flushLogs(identifier) {
  const args = ['flush'];
  if (identifier !== undefined && identifier !== null) {
    args.push(validateProcessIdentifier(identifier));
  }
  return execPm2(args, { timeout: 30000 });
}

export function reloadLogs() {
  return execPm2(['reloadLogs'], { timeout: 30000 });
}

export function listLogFiles() {
  const dir = getPm2LogsDir();
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.log'))
    .map((name) => `${dir}/${name}`);
}

export function streamLogs(identifier, options = {}) {
  const lines = options.lines ?? 15;
  const args = ['logs'];
  if (identifier !== undefined && identifier !== null) {
    args.push(validateProcessIdentifier(identifier));
  } else {
    args.push('--lines', String(lines));
  }
  if (options.errOnly) args.push('--err');
  if (options.outOnly) args.push('--out');
  args.push('--raw');

  const child = spawnPm2(args, { stdio: ['inherit', 'pipe', 'pipe'] });

  let finished = false;
  const stop = () => {
    if (finished) return;
    finished = true;
    child.kill('SIGINT');
  };

  return {
    child,
    stop,
    onData(callback) {
      child.stdout?.on('data', (chunk) => callback(chunk.toString('utf8'), 'out'));
      child.stderr?.on('data', (chunk) => callback(chunk.toString('utf8'), 'err'));
    },
    onExit(callback) {
      child.on('exit', (code, signal) => callback(code, signal));
    },
  };
}

export function streamLogsToConsole(identifier, options = {}) {
  return new Promise((resolve) => {
    const stream = streamLogs(identifier, options);
    stream.onData((chunk) => process.stdout.write(chunk));

    const cleanup = () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode?.(false);
        process.stdin.pause();
      }
      process.stdin.off('data', onData);
    };

    const onData = (data) => {
      const key = data.toString();
      if (key === '\u0003' || key.toLowerCase() === 'q') {
        stream.stop();
      }
    };

    stream.onExit(() => {
      cleanup();
      resolve();
    });

    if (process.stdin.isTTY) {
      process.stdin.setRawMode?.(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    }
  });
}
