import { t } from '../i18n/index.js';

export const ExitCode = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_COMMAND: 2,
  PM2_UNAVAILABLE: 3,
  PERMISSION_ERROR: 4,
  PROCESS_NOT_FOUND: 5,
};

export class MindPM2Error extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.exitCode = options.exitCode ?? ExitCode.GENERAL_ERROR;
    this.hint = options.hint ?? null;
    this.cause = options.cause ?? null;
    this.technical = options.technical ?? null;
  }
}

export class Pm2UnavailableError extends MindPM2Error {
  constructor(message, options = {}) {
    super(message ?? t('error.pm2Unavailable'), {
      exitCode: ExitCode.PM2_UNAVAILABLE,
      hint: options.hint ?? t('error.pm2InstallHint'),
      ...options,
    });
  }
}

export class ProcessNotFoundError extends MindPM2Error {
  constructor(name, options = {}) {
    super(t('error.processNotFound', { name }), {
      exitCode: ExitCode.PROCESS_NOT_FOUND,
      hint: t('error.processListHint'),
      ...options,
    });
    this.processName = name;
  }
}

export class PermissionError extends MindPM2Error {
  constructor(message, options = {}) {
    super(message ?? t('error.permission'), { exitCode: ExitCode.PERMISSION_ERROR, ...options });
  }
}

export class InvalidInputError extends MindPM2Error {
  constructor(message, options = {}) {
    super(message, { exitCode: ExitCode.INVALID_COMMAND, ...options });
  }
}

export class CommandError extends MindPM2Error {
  constructor(message, options = {}) {
    super(message, options);
    this.command = options.command ?? null;
    this.code = options.code ?? null;
    this.stdout = options.stdout ?? '';
    this.stderr = options.stderr ?? '';
  }
}

export function exitCodeFor(error) {
  if (error instanceof MindPM2Error) return error.exitCode;
  return ExitCode.GENERAL_ERROR;
}

export function toMindPM2Error(error) {
  if (error instanceof MindPM2Error) return error;
  return new MindPM2Error(error?.message ?? String(error), { cause: error });
}
