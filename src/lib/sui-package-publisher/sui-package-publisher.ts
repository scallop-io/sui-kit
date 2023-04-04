import { PublishOptions, publishPackage } from "./publish-package";
import {RawSigner} from "@mysten/sui.js";

export class SuiPackagePublisher {
  public suiBin: string;
  constructor(suiBin?: string) {
    this.suiBin = suiBin || 'sui';
  }

  /**
   * publish the move package at the given path
   * It starts a child process to call the "sui binary" to build the move package
   * The building process takes place in a tmp directory, which would be cleaned later
   * @param packagePath
   */
  async publishPackage(packagePath: string, signer: RawSigner, options?: PublishOptions) {
    return publishPackage(this.suiBin, packagePath, signer, options)
  }
}
