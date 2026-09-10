export function parseVersion(input) {
  if (!input) return null;
  const match = String(input)
    .trim()
    .replace(/^v/i, '')
    .match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: String(input).trim(),
  };
}

export function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (!va || !vb) return 0;
  if (va.major !== vb.major) return va.major > vb.major ? 1 : -1;
  if (va.minor !== vb.minor) return va.minor > vb.minor ? 1 : -1;
  if (va.patch !== vb.patch) return va.patch > vb.patch ? 1 : -1;
  return 0;
}

export function satisfies(version, range) {
  const v = parseVersion(version);
  if (!v) return false;
  const min = parseVersion(range);
  if (!min) return true;
  return compareVersions(version, range) >= 0;
}

export function formatVersion(version) {
  const v = parseVersion(version);
  if (!v) return String(version ?? 'unknown');
  return `${v.major}.${v.minor}.${v.patch}`;
}
