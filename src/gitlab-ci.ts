import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { join } from "path";
import type { PackageConfig } from "./types";

export function createDynamicGitlabCi(packagesThatNeedUpdate: PackageConfig[]) {
  const gitlabCiDynamicParts = packagesThatNeedUpdate.map(({ pkg, config }) => {
    const filePath = join(pkg.dir, config.gitlabCiFile);

    if (!existsSync(filePath)) {
      throw new Error(`File ${filePath} not found`);
    }

    console.log(`Processing ${filePath}`);
    const fileText = readFileSync(filePath, "utf8")
      .replaceAll("__PACKAGE_VERSION__", `"${pkg.packageJson.version}"`)
      .replaceAll("__PACKAGE_NAME__", `"${pkg.packageJson.name}"`)
      .replaceAll("__PACKAGE_DIR__", `"${pkg.dir}"`);

    return fileText;
  });

  const gitlabCiDynamic = gitlabCiDynamicParts.join("\n");

  writeFileSync(join(process.cwd(), ".gitlab-ci-dynamic.yml"), gitlabCiDynamic);
}

export function createEmptyGitlabCi() {
  const srcPath = join(process.cwd(), ".gitlab-ci-empty.yml");
  const gitlabCiEmptyExists = existsSync(srcPath);

  if (!gitlabCiEmptyExists) {
    throw new Error(
      ".gitlab-ci-empty.yml not found. Please create it manually in the root of your repository."
    );
  }

  const targetPath = join(process.cwd(), ".gitlab-ci-dynamic.yml");
  copyFileSync(srcPath, targetPath);
}
