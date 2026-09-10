import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProcess } from '../../src/pm2/processes.js';
import { formatBytes } from '../../src/system/memory.js';
import { formatDuration } from '../../src/ui/tables.js';
import { sortProcesses } from '../../src/cli/commands/helpers.js';

const sample = {
  pm_id: 3,
  name: 'MindAPI',
  pid: 1234,
  monit: { cpu: 1.5, memory: 88080384 },
  pm2_env: {
    status: 'online',
    exec_mode: 'cluster_mode',
    instances: 2,
    restart_time: 4,
    unstable_restarts: 1,
    pm_uptime: Date.now() - 5000,
    pm_exec_path: '/srv/app/index.js',
    pm_cwd: '/srv/app',
    node_version: '22.14.0',
    watch: false,
    max_memory_restart: '500M',
    env: { PORT: '3000' },
  },
};

test('normalizeProcess maps pm2 jlist data', () => {
  const proc = normalizeProcess(sample);
  assert.equal(proc.id, 3);
  assert.equal(proc.name, 'MindAPI');
  assert.equal(proc.status, 'online');
  assert.equal(proc.mode, 'cluster');
  assert.equal(proc.instances, 2);
  assert.equal(proc.cpu, 1.5);
  assert.equal(proc.memory, 88080384);
  assert.equal(proc.restartTime, 4);
  assert.equal(proc.script, '/srv/app/index.js');
  assert.ok(proc.uptime >= 4000);
});

test('normalizeProcess handles missing fields', () => {
  const proc = normalizeProcess({});
  assert.equal(proc.status, 'unknown');
  assert.equal(proc.mode, 'fork');
  assert.equal(proc.cpu, 0);
  assert.equal(proc.instances, 1);
});

test('formatBytes formats sizes', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1.00 KB');
  assert.equal(formatBytes(88080384), '84.00 MB');
});

test('formatDuration formats durations', () => {
  assert.equal(formatDuration(0), '-');
  assert.equal(formatDuration(65000), '01:05');
  assert.equal(formatDuration(90000000), '1d 01h');
});

test('sortProcesses sorts numeric and string fields', () => {
  const list = [
    { name: 'b', id: 2, cpu: 5 },
    { name: 'a', id: 1, cpu: 9 },
    { name: 'c', id: 3, cpu: 1 },
  ];
  assert.deepEqual(
    sortProcesses(list, 'name').map((p) => p.name),
    ['a', 'b', 'c']
  );
  assert.deepEqual(
    sortProcesses(list, '-cpu').map((p) => p.cpu),
    [9, 5, 1]
  );
  assert.deepEqual(
    sortProcesses(list, 'id').map((p) => p.id),
    [1, 2, 3]
  );
});
