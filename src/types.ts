import type { Package } from "@manypkg/get-packages";
import type { MogipuConfig } from "./schema";

export interface PackageConfig {
  pkg: Package;
  config: MogipuConfig;
}

export interface FailureResult {
  errors: string[];
  packageName: string;
  packagePath: string;
  path: string;
}
