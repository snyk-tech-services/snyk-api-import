import debug = require("debug");
import type { requestsManager } from "snyk-request-manager";
import { updateProject } from "../api/project";

export async function compareAndUpdateBranches(
  requestManager: requestsManager,
  project: {
    branch: string,
    projectPublicId: string,
  },
  defaultBranch: string,
  orgId: string,
  dryRun = false,
): Promise<{ updated: boolean }> {
  const { branch, projectPublicId } = project;
  let updated = false
  try {

    if (branch != defaultBranch) {
      debug(`Default branch has changed for Snyk project ${projectPublicId}`);
      if (!dryRun) {
        await updateProject(requestManager, orgId, project.projectPublicId, {
          branch: defaultBranch,
        });
      }
      updated = true;
    }

    return { updated }
  } catch (e) {
    throw new Error(
      `Failed to update project ${projectPublicId}. ERROR: ${e.message}`,
    );
  }
}