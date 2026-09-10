import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ENTRY = path.join(ROOT, 'src/index.js');

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [ENTRY, ...args], {
    encoding: 'utf8',
    cwd: options.cwd ?? ROOT,
    env: process.env,
    timeout: 30000,
  });
  return {
    code: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    clean: stripAnsi(`${result.stdout ?? ''}${result.stderr ?? ''}`),
  };
}

function stripAnsi(value) {
  // eslint-disable-next-line no-control-regex
  return String(value).replace(/\u001b\[[0-9;]*m/g, '');
}

test('--version shows MindPM2 version', () => {
  const { clean, code } = run(['--version']);
  assert.equal(code, 0);
  assert.match(clean, /MindPM2\s+v\d+\.\d+\.\d+/);
});

test('version command shows environment', () => {
  const { clean, code } = run(['version']);
  assert.equal(code, 0);
  assert.match(clean, /Node\.js/);
  assert.match(clean, /Platform/);
});

test('version --json returns valid JSON', () => {
  const { stdout, code } = run(['version', '--json']);
  assert.equal(code, 0);
  const data = JSON.parse(stdout);
  assert.ok(data.mindpm2);
  assert.ok(data.node);
});

test('--help lists commands', () => {
  const { clean, code } = run(['--help']);
  assert.equal(code, 0);
  assert.match(clean, /Usage: mindpm2/);
  assert.match(clean, /list/);
  assert.match(clean, /doctor/);
});

test('unknown command fails with exit code 2', () => {
  const { code, clean } = run(['definitely-not-a-command']);
  assert.equal(code, 2);
  assert.match(clean, /Onbekend commando/);
});

test('doctor --json returns checks', () => {
  const { stdout, code } = run(['doctor', '--json']);
  assert.equal(code, 0);
  const data = JSON.parse(stdout);
  assert.ok(Array.isArray(data.checks));
  assert.ok(data.checks.length > 0);
  assert.equal(typeof data.passed, 'number');
});

test('list --json returns processes array', () => {
  const { stdout, code } = run(['list', '--json']);
  assert.equal(code, 0);
  const data = JSON.parse(stdout);
  assert.ok(Array.isArray(data.processes));
});

test('details for unknown process exits with code 5', () => {
  const { code } = run(['details', 'zzz-no-such-process']);
  assert.equal(code, 5);
});

test('config path prints a location', () => {
  const { clean, code } = run(['config', 'path'], {
    cwd: ROOT,
  });
  assert.equal(code, 0);
  assert.match(clean, /config\.json/);
});
