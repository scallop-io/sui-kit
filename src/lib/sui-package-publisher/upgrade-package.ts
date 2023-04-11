import 'colorts/lib/string';
import { execSync } from 'child_process';

/**
 * Options for upgrade packages
 */
export type UpgradeOptions = {
  // Also publish transitive dependencies that are not published yet
  withUnpublishedDependencies?: boolean
  // Skip fetching the latest git dependencies
  skipFetchLatestGitDeps?: boolean
  gasBudget?: number,
}

const defaultUpgradeOptions: UpgradeOptions = {
  withUnpublishedDependencies: true,
  skipFetchLatestGitDeps: false,
  gasBudget: 10**9,
}

/**
 * Upgrade a package to the SUI blockchain using the sui client binary
 * @param suiBinPath, the path to the sui client binary
 * @param packagePath, the path to the package to be built
 */
export const upgradePackage = async (suiBinPath: string, packagePath: string, upgradeCapId: string, options: UpgradeOptions = defaultUpgradeOptions) => {
  try {
    const withUnpublishedDep = options.withUnpublishedDependencies ? '--with-unpublished-dependencies' : '';
    const skipDepFetch = options.skipFetchLatestGitDeps ? '--skip-fetch-latest-git-deps' : '';
    const gasBudget = options.gasBudget || defaultUpgradeOptions.gasBudget as number;
    const gasBudgetOption = `--gas-budget ${gasBudget}`;
    const upgradeCmd =
      `${suiBinPath} client upgrade ${skipDepFetch} ${withUnpublishedDep} ${gasBudgetOption} --upgrade-capability ${upgradeCapId} ${packagePath}`;
    console.log('Running upgrade package command')
    console.log(upgradeCmd.cyan.bold)
    const upgradeCommandOutput = execSync(upgradeCmd, {encoding: 'utf-8'});
    return upgradeCommandOutput;
  } catch (e) {
    console.error('Build package failed!'.red);
    throw new Error(`error building package at ${packagePath}, error: ${e}`);
  }
}
