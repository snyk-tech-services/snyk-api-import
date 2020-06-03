import * as path from 'path';

import {
  IMPORT_LOG_NAME,
  FAILED_LOG_NAME,
  FAILED_PROJECTS_LOG_NAME,
  IMPORT_JOBS_LOG_NAME,
} from '../src/common';

export function generateLogsPaths(
  logPath: string,
  orgId: string,
): {
  importLogPath: string;
  failedImportLogPath: string;
  failedProjectsLogPath: string;
  importJobIdsLogsPath: string;
} {
  process.env.SNYK_LOG_PATH = logPath;
  const importLogPath = path.resolve(logPath, `${IMPORT_LOG_NAME}`);
  const failedImportLogPath = path.resolve(logPath, `${FAILED_LOG_NAME}`);
  const failedProjectsLogPath = path.resolve(logPath, FAILED_PROJECTS_LOG_NAME);
  const importJobIdsLogsPath = path.resolve(logPath, `${orgId}.${IMPORT_JOBS_LOG_NAME}`);

  return {
    importLogPath,
    failedImportLogPath,
    failedProjectsLogPath,
    importJobIdsLogsPath,
  };
}