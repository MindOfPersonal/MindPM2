import {
  select,
  input,
  confirm,
  checkbox,
  password,
  number,
} from '@inquirer/prompts';

export const BACK = Symbol('back');
export const ABORT = Symbol('abort');

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
    });
  } catch (error) {
    return normalizeError(error);
  }
}

export async function passwordPrompt(message) {
  try {
    return await password({ message, mask: '*' });
  } catch (error) {
    return normalizeError(error);
  }
}

export function choice(name, value, description) {
  return { name, value, description };
}
