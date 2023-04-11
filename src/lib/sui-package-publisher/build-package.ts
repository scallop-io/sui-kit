import tmp from 'tmp';
import 'colorts/lib/string';
import { execSync } from 'child_process';
import {
  normalizeSuiObjectId,
  ObjectId,
} from "@mysten/sui.js";

/**
 * Options for build & publish packages
 */
export type BuildOptions = {
  // Also publish transitive dependencies that are not published yet
  withUnpublishedDependencies?: boolean
  // Skip fetching the latest git dependencies
  skipFetchLatestGitDeps?: boolean
}

export const defaultBuildOptions: BuildOptions = {
  withUnpublishedDependencies: true,
  skipFetchLatestGitDeps: false,
}

type BuildPackageResult = {
  modules: string[]; // base64 encoded compiled modules
  dependencies: ObjectId[]; // dependencies of the package
  digest: string; // the package digest
}
/**
 * builds a package and returns the compiled modules and dependencies
 * the package is built in a temporary directory, which is cleaned up after the build
 * @param suiBinPath, the path to the sui client binary
 * @param packagePath, the path to the package to be built
 * @returns {BuildPackageResult}, the compiled modules and dependencies
 */
export const buildPackage = (suiBinPath: string, packagePath: string, options: BuildOptions = defaultBuildOptions) => {
  // remove all controlled temp objects on process exit
  tmp.setGracefulCleanup()

  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  try {
    const withUnpublishedDep = options.withUnpublishedDependencies ? '--with-unpublished-dependencies' : '';
    const skipDepFetch = options.skipFetchLatestGitDeps ? '--skip-fetch-latest-git-deps' : '';
    const buildCmd =
      `${suiBinPath} move build --dump-bytecode-as-base64 --dump-package-digest --path ${packagePath} ${skipDepFetch} ${withUnpublishedDep}`;
    console.log('Running build package command')
    console.log(buildCmd.cyan.bold)
    const buildCommandOutput = execSync(`${buildCmd} --install-dir ${tmpDir.name}`, {encoding: 'utf-8'});
    const [modulesAndDeps, digest] = buildCommandOutput.split('\n');
    const compiledModulesAndDeps = JSON.parse(modulesAndDeps);
    console.log('Build package success'.green)
    return {
      modules: compiledModulesAndDeps.modules,
      dependencies: compiledModulesAndDeps.dependencies.map((dependencyId: string) => normalizeSuiObjectId(dependencyId)),
      digest: digest,
    } as BuildPackageResult;
  } catch (e) {
    console.error('Build package failed!'.red);
    throw new Error(`error building package at ${packagePath}, error: ${e}`);
  }
}
