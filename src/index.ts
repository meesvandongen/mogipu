#!/usr/bin/env node

import { getPackages } from "@manypkg/get-packages";
import { cosmiconfig } from "cosmiconfig";
import { mogipuConfigSchema } from "./schema";
import type { FailureResult, PackageConfig } from "./types";
import { fetchRegistryRepositories, getPackagesThatNeedUpdate } from "./gitlab";
import { createEmptyGitlabCi, createDynamicGitlabCi } from "./gitlab-ci";
import { createFailureResult, printFailureResults } from "./error";

async function main() {
  const gitlabToken = process.env.GITLAB_TOKEN;
  if (!gitlabToken) {
    throw new Error("GITLAB_TOKEN is not set");
  }

  const projectId = process.env.CI_PROJECT_ID;
  if (!projectId) {
    throw new Error("CI_PROJECT_ID is not set");
  }

  const { packages } = await getPackages(process.cwd());

  if (packages.length === 0) {
    throw new Error("No packages found");
  }

  const packagesConfigs: PackageConfig[] = [];
  const failureResults: FailureResult[] = [];

  for (const pkg of packages) {
    const cosmicConfigResult = await cosmiconfig("mogipu", {
      searchStrategy: "none",
    }).search(pkg.dir);

    if (!cosmicConfigResult) {
      continue;
    }

    if (cosmicConfigResult.isEmpty) {
      continue;
    }

    const parsedConfigResult = mogipuConfigSchema.safeParse(
      cosmicConfigResult.config
    );

    if (parsedConfigResult.success) {
      packagesConfigs.push({
        pkg,
        config: parsedConfigResult.data,
      });
    } else {
      const failureResult: FailureResult = createFailureResult(
        parsedConfigResult.error.errors,
        pkg,
        cosmicConfigResult
      );

      failureResults.push(failureResult);
    }
  }

  if (failureResults.length > 0) {
    printFailureResults(failureResults);
    process.exit(1);
  }

  if (packagesConfigs.length === 0) {
    return createEmptyGitlabCi();
  }

  const repositories = await fetchRegistryRepositories();

  const packagesThatNeedUpdate = await getPackagesThatNeedUpdate(
    packagesConfigs,
    repositories
  );

  if (packagesThatNeedUpdate.length === 0) {
    return createEmptyGitlabCi();
  }

  return createDynamicGitlabCi(packagesThatNeedUpdate);
}

main();
