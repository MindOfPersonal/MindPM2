import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'mindpm2-config-'));
process.env.MINDPM2_HOME = tmpHome;

const { loadConfig, saveConfig, set, get, resetConfig, clearCache } = await import(
  '../../src/config/manager.js'
);
const { DEFAULT_CONFIG, validateConfig } = await import('../../src/config/defaults.js');

test('loadConfig returns defaults when no file exists', () => {
  clearCache();
  const config = loadConfig();
  assert.deepEqual(Object.keys(config).sort(), Object.keys(DEFAULT_CONFIG).sort());
});

test('saveConfig persists and reloads', () => {
  saveConfig({ ...DEFAULT_CONFIG, refreshInterval: 5000 });
  clearCache();
  assert.equal(loadConfig().refreshInterval, 5000);
});

test('set updates a single key', () => {
  set('theme', 'dark');
  clearCache();
  assert.equal(get('theme'), 'dark');
});

test('invalid configuration is rejected', () => {
  assert.throws(() => saveConfig({ ...DEFAULT_CONFIG, refreshInterval: 10 }));
  assert.throws(() => saveConfig({ ...DEFAULT_CONFIG, theme: 'neon' }));
});

test('validateConfig reports errors', () => {
  const errors = validateConfig({ refreshInterval: -1, theme: 'bad' });
  assert.equal(errors.length, 2);
});

test('resetConfig restores defaults', () => {
  resetConfig();
  clearCache();
  assert.equal(loadConfig().theme, DEFAULT_CONFIG.theme);
});
