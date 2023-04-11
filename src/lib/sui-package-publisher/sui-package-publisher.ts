import {RawSigner} from "@mysten/sui.js";
import { PublishOptions, publishPackage } from "./publish-package";
import { upgradePackage, UpgradeOptions } from "./upgrade-package"
import { buildPackage, BuildOptions } from "./build-package"

export class SuiPackagePublisher {
  public suiBin: string;
  constructor(suiBin?: string) {
    this.suiBin = suiBin || 'sui';
  }

  /**
   * publish the move package at the given path
   * It starts a child process to call the "sui binary" to build the move package
   * The building process takes place in a tmp directory, which would be cleaned later
   * @param packagePath the path to the package to be published
   * @param signer the signer who is going to upgrade the package
   */
  async publishPackage(packagePath: string, signer: RawSigner, options?: PublishOptions) {
    return publishPackage(this.suiBin, packagePath, signer, options)
  }

  async upgradePackage(packagePath: string, upgradeCapId: string, options?: UpgradeOptions ) {
    return upgradePackage(this.suiBin, packagePath, upgradeCapId, options);
  }

  buildPackage(packagePath: string, options?: BuildOptions) {
    return buildPackage(this.suiBin, packagePath, options);
  }
}
