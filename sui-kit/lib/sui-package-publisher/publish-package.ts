import tmp from 'tmp';
import { execSync } from 'child_process';
import {
	TransactionBlock,
	fromB64,
	normalizeSuiObjectId,
	ObjectId,
	RawSigner,
	getExecutionStatusType,
} from "@mysten/sui.js";
import {parsePublishTxn} from './sui-response-parser';

/**
 * Options for build & publish packages
 */
type BuildOptions = {
	// Also publish transitive dependencies that are not published yet
	withUnpublishedDependencies?: boolean
	// Skip fetching the latest git dependencies
	skipFetchLatestGitDeps?: boolean
}

export type PublishOptions = BuildOptions & {
	// The gas budget for the publish transaction
	gasBudget?: number
} 
const defaultBuildOptions: BuildOptions = {
	withUnpublishedDependencies: true,
	skipFetchLatestGitDeps: true,
}
const defaultPublishOptions: PublishOptions = {
	...defaultBuildOptions,
	gasBudget: 100000,
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

type BuildPackageResult = {
	modules: string[]; // base64 encoded compiled modules
	dependencies: ObjectId[]; // dependencies of the package
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
			`${suiBinPath} move build --dump-bytecode-as-base64 --path ${packagePath} ${skipDepFetch} ${withUnpublishedDep}`;
		console.log('Running build package command')
		console.log(buildCmd.cyan.bold)
		const buildCommandOutput = execSync(`${buildCmd} --install-dir ${tmpDir.name}`, {encoding: 'utf-8'});
		const compiledModulesAndDeps = JSON.parse(buildCommandOutput);
		console.log('Build package success'.green)
		return {
			modules: compiledModulesAndDeps.modules,
			dependencies: compiledModulesAndDeps.dependencies.map((dependencyId: string) => normalizeSuiObjectId(dependencyId))
		} as BuildPackageResult;
	} catch (e) {
		console.error('Build package failed!'.red);
		throw new Error(`error building package at ${packagePath}, error: ${e}`);
	}
}
