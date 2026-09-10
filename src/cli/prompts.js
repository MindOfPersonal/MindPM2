import {
  select,
  input,
  confirm,
  checkbox,
  password,
  number,
} from '@inquirer/prompts';
import { theme, ICONS } from '../ui/colors.js';

export const BACK = Symbol('back');
export const ABORT = Symbol('abort');

function promptTheme() {
  return {
    prefix: {
      idle: theme.primary(ICONS.brand),
      done: theme.success(ICONS.ok),
    },
    icon: {
      cursor: theme.primary(ICONS.pointer),
    },
    style: {
      message: (text) => theme.title(text),
      answer: (text) => theme.success(text),
      highlight: (text) => theme.primaryBold(text),
      disabled: (text) => theme.dim(`- ${text}`),
      description: (text) => theme.muted(text),
      error: (text) => theme.error(`> ${text}`),
      defaultAnswer: (text) => theme.dim(`(${text})`),
      keysHelpTip: (keys) =>
        keys
          .map(([key, action]) => `${theme.accent(key)} ${theme.dim(action)}`)
          .join(theme.dim(` ${ICONS.bullet} `)),
    },
    helpMode: 'always',
    indexMode: 'hidden',
  };
}

function normalizeError(error) {
  if (error?.name === 'ExitPromptError' || error?.name === 'AbortPromptError') {
    return BACK;
  }
  if (error?.name === 'AbortError') return BACK;
  throw error;
}

export async function selectPrompt(message, choices, options = {}) {
  try {
    return await select({
      message,
      choices,
      pageSize: options.pageSize ?? 15,
      loop: options.loop ?? true,
      theme: promptTheme(),
    });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function checkboxPrompt(message, choices, options = {}) {
  try {
    return await checkbox({
      message,
      choices,
      pageSize: options.pageSize ?? 15,
      required: options.required ?? false,
      theme: promptTheme(),
    });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function inputPrompt(message, options = {}) {
  try {
    return await input({
      message,
      default: options.default,
      validate: options.validate,
      transformer: options.transformer,
      theme: promptTheme(),
    });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function confirmPrompt(message, options = {}) {
  try {
    return await confirm({
      message,
      default: options.default ?? false,
      theme: promptTheme(),
    });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function numberPrompt(message, options = {}) {
  try {
    return await number({
      message,
      default: options.default,
      min: options.min,
      max: options.max,
      required: options.required,
      theme: promptTheme(),
    });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function passwordPrompt(message) {
  try {
    return await password({ message, mask: '*', theme: promptTheme() });
  } catch (error) {
    return normalizeError(error);
  }
}

export function choice(name, value, description) {
  return { name, value, description };
}
