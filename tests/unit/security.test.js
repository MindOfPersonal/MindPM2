import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProcessIdentifier,
  validateMemory,
  validateInstances,
  validatePort,
  isValidProcessName,
} from '../../src/security/validator.js';
import {
  maskEnvVars,
  isSensitiveKey,
  escapeShellArg,
  sanitizeText,
  stripAnsi,
} from '../../src/security/sanitizer.js';
import { InvalidInputError } from '../../src/utils/errors.js';

test('validateProcessIdentifier accepts names and ids', () => {
  assert.equal(validateProcessIdentifier('MindAPI'), 'MindAPI');
  assert.equal(validateProcessIdentifier('0'), '0');
  assert.equal(validateProcessIdentifier('my-app_1.2'), 'my-app_1.2');
});

test('validateProcessIdentifier accepts names containing spaces', () => {
  assert.equal(validateProcessIdentifier('MindGit - Agent'), 'MindGit - Agent');
  assert.equal(validateProcessIdentifier('  MindDB - Dev  '), 'MindDB - Dev');
});

test('validateProcessIdentifier rejects dangerous input', () => {
  assert.throws(() => validateProcessIdentifier('foo; rm -rf /'), InvalidInputError);
  assert.throws(() => validateProcessIdentifier(''), InvalidInputError);
  assert.throws(() => validateProcessIdentifier('$(whoami)'), InvalidInputError);
});

test('validateMemory accepts common formats', () => {
  assert.equal(validateMemory('500M'), '500M');
  assert.equal(validateMemory('1g'), '1G');
  assert.equal(validateMemory('256 KB'), '256KB');
  assert.equal(validateMemory(''), null);
  assert.throws(() => validateMemory('lots'), InvalidInputError);
});

test('validateInstances validates numbers', () => {
  assert.equal(validateInstances('2'), 2);
  assert.equal(validateInstances('max'), 'max');
  assert.throws(() => validateInstances('0'), InvalidInputError);
  assert.throws(() => validateInstances('-1'), InvalidInputError);
  assert.throws(() => validateInstances('abc'), InvalidInputError);
});

test('validatePort validates range', () => {
  assert.equal(validatePort('3000'), 3000);
  assert.throws(() => validatePort('70000'), InvalidInputError);
});

test('isValidProcessName rejects empty', () => {
  assert.equal(isValidProcessName('app'), true);
  assert.equal(isValidProcessName(''), false);
});

test('maskEnvVars masks sensitive keys', () => {
  const masked = maskEnvVars({
    NODE_ENV: 'production',
    DATABASE_PASSWORD: 'secret',
    API_KEY: '123',
    TOKEN: 'abc',
  });
  assert.equal(masked.NODE_ENV, 'production');
  assert.equal(masked.DATABASE_PASSWORD, '********');
  assert.equal(masked.API_KEY, '********');
  assert.equal(masked.TOKEN, '********');
});

test('maskEnvVars can reveal values', () => {
  const revealed = maskEnvVars({ SECRET: 'value' }, { reveal: true });
  assert.equal(revealed.SECRET, 'value');
});

test('isSensitiveKey detects common secrets', () => {
  assert.equal(isSensitiveKey('DB_PASSWORD'), true);
  assert.equal(isSensitiveKey('AUTH_TOKEN'), true);
  assert.equal(isSensitiveKey('PORT'), false);
});

test('escapeShellArg quotes safely', () => {
  const escaped = escapeShellArg("a'b");
  assert.match(escaped, /^'a'\\''b'$|^"a'b"$/);
});

test('sanitizeText removes null bytes and truncates', () => {
  assert.equal(sanitizeText('a\u0000b'), 'ab');
  assert.equal(sanitizeText('abcdef', 3), 'abc');
});

test('stripAnsi removes color codes', () => {
  assert.equal(stripAnsi('\u001b[31mred\u001b[39m'), 'red');
});
