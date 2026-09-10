#!/usr/bin/env node
import { runCli } from './cli/program.js';
import { handleError } from './cli/output.js';
import { logger } from './utils/logger.js';

process.title = 'mindpm2';

process.stdout.on('error', (error) => {
  if (error.code === 'EPIPE') process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason?.stack || reason}`);
  process.exitCode = handleError(reason, {});
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught exception: ${error?.stack || error}`);
  process.exitCode = handleError(error, {});
});

runCli().catch((error) => {
  process.exitCode = handleError(error, {});
});
