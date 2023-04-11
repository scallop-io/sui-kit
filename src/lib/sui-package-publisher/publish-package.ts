import 'colorts/lib/string';
import {
  TransactionBlock,
  fromB64,
  RawSigner,
  getExecutionStatusType,
} from "@mysten/sui.js";
import {parsePublishTxn} from './sui-response-parser';
import { BuildOptions, defaultBuildOptions, buildPackage } from './build-package'

export type PublishOptions = BuildOptions & {
  // The gas budget for the publish transaction
  gasBudget?: number
} 
const defaultPublishOptions: PublishOptions = {
  ...defaultBuildOptions,
  gasBudget: 10**8,
}

/**
 * Publishes a package to the SUI blockchain, and returns the packageId and publish txn response
 * @param suiBinPath, the path to the sui client binary
 * @param packagePath, the path to the package to be built
 * @param signer, signer who is going the publish the package
 * @returns { packageId, publishTxn }, the packageId and publishTxn
 */
export const publishPackage = async (suiBinPath: string, packagePath: string, signer: RawSigner, options: PublishOptions = defaultPublishOptions) => {
  const gasBudget = options.gasBudget || defaultPublishOptions.gasBudget as number;

  // build the package
  const compiledModulesAndDeps = buildPackage(suiBinPath, packagePath, options);

  // create a transaction block for publish package
  const publishTxnBlock = new TransactionBlock();
  // TODO: publish dry run fails currently. Remove this once it's fixed.
  publishTxnBlock.setGasBudget(gasBudget);

  // obtain the upgradeCap, and transfer it to the publisher
  const upgradeCap = publishTxnBlock.publish(
    compiledModulesAndDeps.modules.map(m => Array.from(fromB64(m))),
    compiledModulesAndDeps.dependencies,
  )
  const publisher = publishTxnBlock.pure(await signer.getAddress());
  publishTxnBlock.transferObjects([upgradeCap], publisher);

  // sign and submit the transaction for publishing the package
  console.log(`Start publishing package at ${packagePath}`)
  const publishTxn = await signer.signAndExecuteTransactionBlock({
    transactionBlock: publishTxnBlock,
    options: { showEffects: true, showObjectChanges: true },
  });
  // If the publish transaction is successful, retrieve the packageId from the 'publish' event
  // Otherwise, return empty data
  if (getExecutionStatusType(publishTxn) === 'success') {
    const { packageId, upgradeCapId, created } = parsePublishTxn(publishTxn);
    console.log('Successfully published package\n'.green)
    console.log('==============Created objects=============='.gray)
    created.forEach(({ type, objectId , owner}) => {
      console.log('type: '.gray, type)
      console.log('owner: '.gray, owner)
      console.log('objectId: '.gray, objectId, '\n')
    })
    console.log('==============Package info=============='.gray)
    console.log('PackageId: '.gray, packageId.blue.bold)
    console.log('UpgradeCapId: '.gray, upgradeCapId.blue.bold, '\n')
    return { packageId, publishTxn };
  } else {
    console.error('Publish package failed!'.red)
    return { packageId: '', publishTxn };
  }
}
