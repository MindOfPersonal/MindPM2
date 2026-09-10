import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  createTemplate,
  validate,
  parse,
  listApps,
} from '../../src/pm2/ecosystem.js';
import { detectEcosystemFiles } from '../../src/utils/paths.js';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mindpm2-eco-'));

test('createTemplate writes an ecosystem file', () => {
  const originalCwd = process.cwd();
  process.chdir(tmpDir);
  try {
    const file = createTemplate('ecosystem.config.cjs');
    assert.ok(fs.existsSync(file));
    assert.throws(() => createTemplate('ecosystem.config.cjs'));
  } finally {
    process.chdir(originalCwd);
  }
});

test('validate accepts a generated template', async () => {
  const file = path.join(tmpDir, 'ecosystem.config.cjs');
  const result = await validate(file);
  assert.equal(result.valid, true);
  assert.equal(result.apps.length, 1);
  assert.equal(result.apps[0].name, 'app');
});

test('parse reads apps from config', async () => {
  const file = path.join(tmpDir, 'ecosystem.config.cjs');
  const config = await parse(file);
  assert.equal(config.apps.length, 1);
  assert.equal(config.path, file);
});

test('listApps returns app summaries', async () => {
  const file = path.join(tmpDir, 'ecosystem.config.cjs');
  const apps = await listApps(file);
  assert.equal(apps[0].script, './index.js');
});

test('validate reports an invalid config', async () => {
  const file = path.join(tmpDir, 'bad.config.json');
  fs.writeFileSync(file, JSON.stringify({ apps: [{ script: './x.js' }] }));
  const result = await validate(file);
  assert.equal(result.valid, false);
});

test('detectEcosystemFiles finds known names', () => {
  const originalCwd = process.cwd();
  process.chdir(tmpDir);
  try {
    const found = detectEcosystemFiles();
    assert.ok(found.some((file) => file.endsWith('ecosystem.config.cjs')));
  } finally {
    process.chdir(originalCwd);
  }
});
