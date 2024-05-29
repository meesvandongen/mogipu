import type { PackageConfig } from "./types";

function createFetchHeaders() {
  const gitlabToken = process.env.GITLAB_TOKEN;
  if (!gitlabToken) {
    throw new Error("GITLAB_TOKEN is not set");
  }

  const fetchHeaders = new Headers();
  fetchHeaders.append("PRIVATE-TOKEN", gitlabToken);

  return fetchHeaders;
}

export async function fetchRegistryRepositories() {
  const projectId = process.env.CI_PROJECT_ID;
  if (!projectId) {
    throw new Error("CI_PROJECT_ID is not set");
  }
  const res = await fetch(
    `https://gitlab.com/api/v4/projects/${projectId}/registry/repositories`,
    {
      headers: createFetchHeaders(),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch registry repositories: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchRegistryTagExists(
  { config, pkg }: PackageConfig,
  repositories: any[]
): Promise<boolean> {
  const projectId = process.env.CI_PROJECT_ID;
  if (!projectId) {
    throw new Error("CI_PROJECT_ID is not set");
  }

  const name = config.imageName ?? pkg.packageJson.name;

  const repository = repositories.find((repo) => repo.name === name);

  if (!repository) {
    return false;
  }

  const res = await fetch(
    `https://gitlab.com/api/v4/projects/${projectId}/registry/repositories/${repository.id}/tags/${pkg.packageJson.version}`,
    {
      headers: createFetchHeaders(),
      method: "HEAD",
    }
  );

  if (!res.ok) {
    return false;
  }

  return true;
}

export async function getPackagesThatNeedUpdate(
    packagesConfigs: PackageConfig[],
    repositories: any
  ) {
    return (
      await Promise.all(
        packagesConfigs.map(async (packageConfig) => {
          const exists = await fetchRegistryTagExists(
            packageConfig,
            repositories
          );
          return {
            packageConfig,
            exists,
          };
        })
      )
    )
      .filter(({ exists }) => !exists)
      .map(({ packageConfig }) => packageConfig);
  }
  