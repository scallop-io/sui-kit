import { SuiInteractorParams, NetworkType } from '../../types/index.js';
import { SuiOwnedObject, SuiSharedObject } from '../suiModel/index.js';
import { batch, delay } from './util.js';
import { SuiGrpcClient, type SuiGrpcClientOptions } from '@mysten/sui/grpc';
import type { BaseClient, SuiClientTypes } from '@mysten/sui/client';

const MAX_OBJECTS_PER_REQUEST = 50;

// Helper to create gRPC client options with baseUrl
function createGrpcClientOptions(
  url: string,
  network: NetworkType
): SuiGrpcClientOptions {
  return { baseUrl: url, network } satisfies SuiGrpcClientOptions;
}

// Helper to get fullnode URLs for each network
function getFullnodeUrl(network: NetworkType): string {
  switch (network) {
    case 'mainnet':
      return 'https://fullnode.mainnet.sui.io:443';
    case 'testnet':
      return 'https://fullnode.testnet.sui.io:443';
    case 'devnet':
      return 'https://fullnode.devnet.sui.io:443';
    case 'localnet':
      return 'http://127.0.0.1:9000';
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}

// Object data type from SDK v2
export type SuiObjectData = SuiClientTypes.Object<{
  content: true;
  json: true;
}>;

// Options for getObjects (SDK v2 naming)
export type SuiObjectDataOptions = SuiClientTypes.ObjectInclude;

// Simulate transaction response type
export type SimulateTransactionResponse =
  SuiClientTypes.SimulateTransactionResult<{
    effects: true;
    events: true;
    balanceChanges: true;
    commandResults: true;
  }>;

/**
 * Encapsulates all functions that interact with the sui sdk
 */
export class SuiInteractor {
  private clients: BaseClient[] = [];
  public currentClient: BaseClient;
  private fullNodes: string[] = [];
  private network: NetworkType;

  constructor(params: Partial<SuiInteractorParams>) {
    // Default network
    this.network = 'mainnet';

    if ('fullnodeUrls' in params && params.fullnodeUrls) {
      this.network = params.network ?? 'mainnet';
      this.fullNodes = params.fullnodeUrls;
      this.clients = this.fullNodes.map(
        (url) => new SuiGrpcClient(createGrpcClientOptions(url, this.network))
      );
    } else if ('suiClients' in params && params.suiClients) {
      this.clients = params.suiClients;
    } else {
      this.fullNodes = [getFullnodeUrl(this.network)];
      this.clients = [
        new SuiGrpcClient(
          createGrpcClientOptions(this.fullNodes[0], this.network)
        ),
      ];
    }
    this.currentClient = this.clients[0];
  }

  switchToNextClient() {
    const currentClientIdx = this.clients.indexOf(this.currentClient);
    this.currentClient =
      this.clients[(currentClientIdx + 1) % this.clients.length];
  }

  switchFullNodes(fullNodes: string[], network?: NetworkType) {
    if (fullNodes.length === 0) {
      throw new Error('fullNodes cannot be empty');
    }
    this.fullNodes = fullNodes;
    if (network) {
      this.network = network;
    }
    this.clients = fullNodes.map(
      (url) => new SuiGrpcClient(createGrpcClientOptions(url, this.network))
    );
    this.currentClient = this.clients[0];
  }

  get currentFullNode() {
    if (this.fullNodes.length === 0) {
      throw new Error('No full nodes available');
    }

    const clientIdx = this.clients.indexOf(this.currentClient);
    if (clientIdx === -1) {
      throw new Error('Current client not found');
    }

    return this.fullNodes[clientIdx];
  }

  async sendTx(
    transactionBlock: Uint8Array | string,
    signature: string | string[]
  ): Promise<
    SuiClientTypes.TransactionResult<{
      balanceChanges: true;
      effects: true;
      events: true;
      objectTypes: true;
    }>
  > {
    const txBytes =
      typeof transactionBlock === 'string'
        ? Uint8Array.from(Buffer.from(transactionBlock, 'base64'))
        : transactionBlock;

    const signatures = Array.isArray(signature) ? signature : [signature];

    for (const clientIdx in this.clients) {
      try {
        return await this.clients[clientIdx].core.executeTransaction({
          transaction: txBytes,
          signatures,
          include: {
            balanceChanges: true,
            effects: true,
            events: true,
            objectTypes: true,
          },
        });
      } catch (err) {
        console.warn(
          `Failed to send transaction with fullnode ${this.fullNodes[clientIdx]}: ${err}`
        );
        await delay(2000);
      }
    }
    throw new Error('Failed to send transaction with all fullnodes');
  }

  async dryRunTx(
    transactionBlock: Uint8Array
  ): Promise<SimulateTransactionResponse> {
    for (const clientIdx in this.clients) {
      try {
        return await this.clients[clientIdx].core.simulateTransaction({
          transaction: transactionBlock,
          include: {
            effects: true,
            events: true,
            balanceChanges: true,
            commandResults: true,
          },
        });
      } catch (err) {
        console.warn(
          `Failed to dry run transaction with fullnode ${this.fullNodes[clientIdx]}: ${err}`
        );
        await delay(2000);
      }
    }
    throw new Error('Failed to dry run transaction with all fullnodes');
  }

  async getObjects(
    ids: string[],
    options?: {
      include?: SuiObjectDataOptions;
      batchSize?: number;
      switchClientDelay?: number;
    }
  ): Promise<SuiObjectData[]> {
    const include = options?.include ?? { content: true, json: true };

    const batchIds = batch(
      ids,
      Math.max(
        options?.batchSize ?? MAX_OBJECTS_PER_REQUEST,
        MAX_OBJECTS_PER_REQUEST
      )
    );
    const results: SuiObjectData[] = [];
    let lastError = null;

    for (const batchChunk of batchIds) {
      for (const clientIdx in this.clients) {
        try {
          const response = await this.clients[clientIdx].core.getObjects({
            objectIds: batchChunk,
            include,
          });

          const parsedObjects = response.objects
            .map((obj) => {
              if (obj instanceof Error) {
                return null;
              }
              return obj as SuiObjectData;
            })
            .filter((object): object is SuiObjectData => object !== null);

          results.push(...parsedObjects);
          lastError = null;
          break; // Exit the client loop if successful
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          await delay(options?.switchClientDelay ?? 2000);
          console.warn(
            `Failed to get objects with fullnode ${this.fullNodes[clientIdx]}: ${err}`
          );
        }
      }
      if (lastError) {
        throw new Error(
          `Failed to get objects with all fullnodes: ${lastError}`
        );
      }
    }

    return results;
  }

  async getObject(id: string, options?: { include?: SuiObjectDataOptions }) {
    const objects = await this.getObjects([id], options);
    return objects[0];
  }

  /**
   * @description Update objects in a batch
   * @param suiObjects
   */
  async updateObjects(suiObjects: (SuiOwnedObject | SuiSharedObject)[]) {
    const objectIds = suiObjects.map((obj) => obj.objectId);
    const objects = await this.getObjects(objectIds);
    for (const object of objects) {
      const suiObject = suiObjects.find(
        (obj) => obj.objectId === object?.objectId
      );
      if (suiObject instanceof SuiSharedObject) {
        const owner = object.owner;
        if (owner && typeof owner === 'object' && 'Shared' in owner) {
          suiObject.initialSharedVersion = (
            owner as { Shared: { initialSharedVersion: string } }
          ).Shared.initialSharedVersion;
        } else {
          suiObject.initialSharedVersion = undefined;
        }
      } else if (suiObject instanceof SuiOwnedObject) {
        suiObject.version = object?.version;
        suiObject.digest = object?.digest;
      }
    }
  }

  /**
   * @description Select coins that add up to the given amount.
   * @param addr the address of the owner
   * @param amount the amount that is needed for the coin
   * @param coinType the coin type, default is '0x2::SUI::SUI'
   */
  async selectCoins(
    addr: string,
    amount: number,
    coinType: string = '0x2::SUI::SUI'
  ) {
    const selectedCoins: {
      objectId: string;
      digest: string;
      version: string;
      balance: string;
    }[] = [];
    let totalAmount = 0;
    let hasNext = true,
      nextCursor: string | null | undefined = null;
    while (hasNext && totalAmount < amount) {
      const { objects, hasNextPage, cursor } =
        await this.currentClient.core.listCoins({
          owner: addr,
          coinType: coinType,
          cursor: nextCursor,
        });
      // Sort the coins by balance in descending order
      objects.sort((a, b) => parseInt(b.balance) - parseInt(a.balance));
      for (const coinData of objects) {
        selectedCoins.push({
          objectId: coinData.objectId,
          digest: coinData.digest,
          version: coinData.version,
          balance: coinData.balance,
        });
        totalAmount = totalAmount + parseInt(coinData.balance);
        if (totalAmount >= amount) {
          break;
        }
      }

      nextCursor = cursor;
      hasNext = hasNextPage;
    }

    if (!selectedCoins.length) {
      throw new Error('No valid coins found for the transaction.');
    }
    return selectedCoins;
  }
}

export { getFullnodeUrl };
