import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPm2Installed,
  isDaemonRunning,
  getPm2Version,
  jlist,
} from '../../src/pm2/daemon.js';
import { listProcesses, normalizeProcess } from '../../src/pm2/processes.js';

const pm2Available = await isPm2Installed();

test('isPm2Installed reflects environment', () => {
  assert.equal(typeof pm2Available, 'boolean');
});

test('getPm2Version returns a version', { skip: !pm2Available }, async () => {
  const version = await getPm2Version();
  assert.match(version, /^\d+\.\d+\.\d+/);
});

test('isDaemonRunning returns a boolean', { skip: !pm2Available }, async () => {
  const running = await isDaemonRunning();
  assert.equal(typeof running, 'boolean');
});

test('jlist returns an array', { skip: !pm2Available }, async () => {
  const data = await jlist();
  assert.ok(Array.isArray(data));
});

test('listProcesses returns normalized processes', { skip: !pm2Available }, async () => {
  const processes = await listProcesses();
  assert.ok(Array.isArray(processes));
  for (const proc of processes) {
    assert.equal(typeof proc.id, 'number');
    assert.equal(typeof proc.name, 'string');
    assert.equal(typeof proc.status, 'string');
    assert.equal(typeof proc.cpu, 'number');
    assert.equal(typeof proc.memory, 'number');
  }
});

test('normalizeProcess is stable for jlist entries', { skip: !pm2Available }, async () => {
  const data = await jlist();
  if (data.length === 0) return;
  const proc = normalizeProcess(data[0]);
  assert.equal(proc.id, data[0].pm_id);
  assert.equal(proc.name, data[0].name);
});
