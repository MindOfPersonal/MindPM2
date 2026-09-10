import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { formatBytes } from './memory.js';

const execFileAsync = promisify(execFile);

export async function getDiskInfo(targetPath = process.cwd()) {
  try {
    if (process.platform === 'win32') {
      return await getWindowsDisk(targetPath);
    }
    return await getUnixDisk(targetPath);
  } catch {
    return null;
  }
}

async function getUnixDisk(targetPath) {
  const { stdout } = await execFileAsync('df', ['-kP', targetPath], { encoding: 'utf8' });
  const lines = stdout.trim().split('\n');
  if (lines.length < 2) return null;
  const parts = lines[1].trim().split(/\s+/);
  const totalKb = Number(parts[1]);
  const usedKb = Number(parts[2]);
  const freeKb = Number(parts[3]);
  const percent = Number(String(parts[4]).replace('%', ''));
  return {
    filesystem: parts[0],
    mount: parts[5] ?? targetPath,
    total: totalKb * 1024,
    used: usedKb * 1024,
    free: freeKb * 1024,
    percent,
    totalFormatted: formatBytes(totalKb * 1024),
    usedFormatted: formatBytes(usedKb * 1024),
    freeFormatted: formatBytes(freeKb * 1024),
  };
}

async function getWindowsDisk(targetPath) {
  const drive = targetPath.slice(0, 2);
  const script = `(Get-PSDrive -Name '${drive.replace(':', '')}') | Select-Object Used,Free | ConvertTo-Json`;
  const { stdout } = await execFileAsync(
    'powershell',
    ['-NoProfile', '-Command', script],
    { encoding: 'utf8' }
  );
  const data = JSON.parse(stdout);
  const used = Number(data.Used);
  const free = Number(data.Free);
  const total = used + free;
  return {
    filesystem: drive,
    mount: drive,
    total,
    used,
    free,
    percent: total > 0 ? Number(((used / total) * 100).toFixed(1)) : 0,
    totalFormatted: formatBytes(total),
    usedFormatted: formatBytes(used),
    freeFormatted: formatBytes(free),
  };
}
