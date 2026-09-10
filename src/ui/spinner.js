import ora from 'ora';
import { theme } from './colors.js';

export function createSpinner(text, options = {}) {
  const enabled = options.enabled ?? process.stdout.isTTY ?? false;
  if (!enabled) {
    let current = text;
    return {
      start(message) {
        if (message) current = message;
        return this;
      },
      text(value) {
        current = value;
        return this;
      },
      succeed(message) {
        if (message) process.stdout.write(`${theme.success('✔')} ${message}\n`);
        return this;
      },
      fail(message) {
        if (message) process.stderr.write(`${theme.error('✖')} ${message}\n`);
        return this;
      },
      warn(message) {
        if (message) process.stdout.write(`${theme.warning('⚠')} ${message}\n`);
        return this;
      },
      info(message) {
        if (message) process.stdout.write(`${theme.muted('ℹ')} ${message}\n`);
        return this;
      },
      stop() {
        return this;
      },
      get text() {
        return current;
      },
    };
  }
  return ora({ text, color: 'blue', spinner: 'dots', ...options });
}

export async function withSpinner(text, fn, options = {}) {
  const spinner = createSpinner(text, options);
  spinner.start();
  try {
    const result = await fn(spinner);
    spinner.succeed(options.successText ?? text);
    return result;
  } catch (error) {
    spinner.fail(options.failText ?? error.message);
    throw error;
  }
}
