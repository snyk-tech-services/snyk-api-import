import 'source-map-support/register';
import * as needle from 'needle';
import * as pMap from 'p-map';
import * as debugLib from 'debug';
import * as _ from 'lodash';
import { Target, FilePath, ImportTarget } from '../types';
import { getApiToken } from '../get-api-token';
import { getSnykHost } from '../get-snyk-host';
import { logImportedTarget } from '../../log-imported-targets';
import { getLoggingPath } from '../get-logging-path';
import { logFailedImports } from '../../log-failed-imports';
import { logImportIdsPerOrg } from '../../log-polling-urls';
import { getConcurrentImportsNumber } from '../get-concurrent-imports-number';

const debug = debugLib('snyk:api-import');

export async function importTarget(
  orgId: string,
  integrationId: string,
  target: Target,
  files?: FilePath[] | undefined,
  loggingPath?: string,
): Promise<{
  pollingUrl: string;
  target: Target;
  orgId: string;
  integrationId: string;
}> {
  const apiToken = getApiToken();
  debug('Importing:', JSON.stringify({ orgId, integrationId, target }));

  if (!orgId || !integrationId || Object.keys(target).length === 0) {
    throw new Error(
      `Missing required parameters. Please ensure you have set: orgId, integrationId, target.
      \nFor more information see: https://snyk.docs.apiary.io/#reference/integrations/import-projects/import`,
    );
  }
  try {
    const body = {
      target,
      files,
    };
    const SNYK_HOST = getSnykHost();

    const res = await needle(
      'post',
      `${SNYK_HOST}/api/v1/org/${orgId}/integrations/${integrationId}/import`,
      body,
      {
        json: true,
        // eslint-disable-next-line @typescript-eslint/camelcase
        read_timeout: 30000,
        headers: {
          Authorization: `token ${apiToken}`,
        },
      },
    );
    if (res.statusCode && res.statusCode !== 201) {
      throw new Error(
        'Expected a 201 response, instead received: ' +
          JSON.stringify(res.body),
      );
    }
    const locationUrl = res.headers['location'];
    if (!locationUrl) {
      throw new Error(
        'No import location url returned. Please re-try the import.',
      );
    }
    debug(`Received locationUrl for ${target.name}: ${locationUrl}`);
    logImportedTarget(orgId, integrationId, target, locationUrl, loggingPath);
    return {
      pollingUrl: locationUrl,
      integrationId,
      target,
      orgId,
    };
  } catch (error) {
    logFailedImports(orgId, integrationId, target, loggingPath);
    const err: {
      message?: string | undefined;
      innerError?: string;
    } = new Error('Could not complete API import');
    err.innerError = error;
    debug(`Could not complete API import: ${error.message}`);
    throw err;
  }
}

export async function importTargets(
  targets: ImportTarget[],
  loggingPath = getLoggingPath(),
): Promise<string[]> {
  const pollingUrls: string[] = [];
  // TODO: validate targets
  await pMap(
    targets,
    async (t) => {
      try {
        const { orgId, integrationId, target, files } = t;
        const { pollingUrl } = await importTarget(
          orgId,
          integrationId,
          target,
          files,
          loggingPath,
        );
        await logImportIdsPerOrg(orgId, pollingUrl);
        pollingUrls.push(pollingUrl);
      } catch (error) {
        const { orgId, integrationId, target } = t;
        logFailedImports(orgId, integrationId, target, loggingPath);
        debug('Failed to process:', JSON.stringify(t), error.message);
      }
    },
    { concurrency: getConcurrentImportsNumber() },
  );
  return _.uniq(pollingUrls);
}
