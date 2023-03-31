import tmp from 'tmp';
import 'colorts/lib/string';
import { execSync } from 'child_process';
import {
	TransactionBlock,
	fromB64,
	normalizeSuiObjectId,
	ObjectId,
	RawSigner,
	getExecutionStatusType,
	getPublishedObjectChanges
} from "@mysten/sui.js";

/**
 * Publishes a package to the SUI blockchain, and returns the packageId and publish txn response
 * @param suiBinPath, the path to the sui client binary
 * @param packagePath, the path to the package to be built
 * @param signer, signer who is going the publish the package
 * @returns { packageId, publishTxn }, the packageId and publishTxn
 */
export const publishPackage = async (suiBinPath: string, packagePath: string, signer: RawSigner) => {

	// build the package
	const compiledModulesAndDeps = buildPackage(suiBinPath, packagePath);

	// create a transaction block for publish package
	const publishTxnBlock = new TransactionBlock();
	// TODO: publish dry run fails currently. Remove this once it's fixed.
	publishTxnBlock.setGasBudget(100000);

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
		const packageId = getPublishedObjectChanges(publishTxn)[0].packageId.replace(
			/^(0x)(0+)/,
			'0x',
		);
		console.log('Successfully published package'.green)
		console.log('Package id: ', packageId.blue.bold)
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
export const buildPackage = (suiBinPath: string, packagePath: string) => {

	// remove all controlled temp objects on process exit
	tmp.setGracefulCleanup()

	const tmpDir = tmp.dirSync({ unsafeCleanup: true });
	try {
		const skipDepFetchOption = '--skip-fetch-latest-git-deps';
		const withUnpublishedDep = '--with-unpublished-dependencies';
		const buildCmd =
			`${suiBinPath} move build --dump-bytecode-as-base64 --path ${packagePath} ${skipDepFetchOption} ${withUnpublishedDep} --install-dir ${tmpDir.name}`;
		console.log('Running build package command')
		console.log(buildCmd.cyan.bold)
		const buildCommandOutput = execSync(buildCmd, {encoding: 'utf-8'});
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
