import type { Package } from "@manypkg/get-packages";
import type { ZodIssue } from "zod";
import { fromZodIssue } from "zod-validation-error";
import type { FailureResult } from "./types";

export function printFailureResults(failureResults: FailureResult[]) {
  console.error(`Errors found in config files`);
  failureResults.forEach(({ errors, packageName, path, packagePath }) => {
    console.error("");
    console.error(`Package: ${packageName}`);
    console.error(`Path: ${path}`);
    console.error(`Package Path: ${packagePath}`);
    console.table(errors);
  });
}

export function createFailureResult(
  issues: ZodIssue[],
  pkg: Package,
  cosmicConfigResult: {
    config: any;
    filepath: string;
    isEmpty?: boolean | undefined;
  }
): FailureResult {
  return {
    errors: issues.map(
      (issue) =>
        fromZodIssue(issue, {
          prefix: null,
        }).message
    ),
    packageName: pkg.packageJson.name,
    packagePath: pkg.dir,
    path: cosmicConfigResult.filepath,
  };
}
