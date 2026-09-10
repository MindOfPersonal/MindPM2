export function isDebugEnabled() {
  if (process.env.MINDPM2_DEBUG === '1' || process.env.MINDPM2_DEBUG === 'true') {
    return true;
  }
  if (process.env.DEBUG && /(^|,|\s)mindpm2(\s|,|$)/.test(process.env.DEBUG)) {
    return true;
  }
  return process.argv.includes('--debug');
}

export function debug(...args) {
  if (!isDebugEnabled()) return;
  const message = args
    .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
    .join(' ');
  process.stderr.write(`[DEBUG] ${message}\n`);
}

export function createDebug(namespace) {
  return (...args) => debug(`[${namespace}]`, ...args);
}
