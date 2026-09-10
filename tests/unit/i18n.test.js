import test from 'node:test';
import assert from 'node:assert/strict';
import { translate, SUPPORTED_LOCALES, getLocale, setLocale, resetLocale } from '../../src/i18n/index.js';

test('supported locales include en and nl', () => {
  assert.deepEqual(SUPPORTED_LOCALES.sort(), ['en', 'nl']);
});

test('translate interpolates parameters', () => {
  const message = translate('en', 'error.processNotFound', { name: 'MindAPI' });
  assert.match(message, /MindAPI/);
});

test('dutch and english differ', () => {
  assert.notEqual(translate('nl', 'menu.processes'), translate('en', 'menu.processes'));
});

test('unknown key falls back to the key itself', () => {
  assert.equal(translate('en', 'does.not.exist'), 'does.not.exist');
});

test('getLocale returns a supported locale', () => {
  resetLocale();
  const locale = getLocale();
  assert.ok(SUPPORTED_LOCALES.includes(locale));
});

test('setLocale overrides the active locale', () => {
  setLocale('nl');
  assert.equal(getLocale(), 'nl');
  setLocale('en');
  assert.equal(getLocale(), 'en');
  resetLocale();
});
