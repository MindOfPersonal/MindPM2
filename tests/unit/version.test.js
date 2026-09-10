import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseVersion,
  compareVersions,
  formatVersion,
  satisfies,
} from '../../src/utils/version.js';

test('parseVersion parses plain and prefixed versions', () => {
  assert.deepEqual(parseVersion('v6.2.1'), {
    major: 6,
    minor: 2,
    patch: 1,
    raw: 'v6.2.1',
  });
  assert.equal(parseVersion('6.2.1-beta.1').major, 6);
  assert.equal(parseVersion('not-a-version'), null);
});

test('compareVersions orders versions', () => {
  assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
  assert.equal(compareVersions('1.2.0', '1.1.9'), 1);
  assert.equal(compareVersions('1.0.0', '2.0.0'), -1);
  assert.equal(compareVersions('2.0.0', '2.0.1'), -1);
});

test('satisfies checks minimum version', () => {
  assert.equal(satisfies('6.0.0', '5.0.0'), true);
  assert.equal(satisfies('4.5.0', '5.0.0'), false);
});

test('formatVersion normalizes input', () => {
  assert.equal(formatVersion('v6.2.1-beta'), '6.2.1');
  assert.equal(formatVersion(null), 'unknown');
});
