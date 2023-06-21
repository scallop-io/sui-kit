import { DisplayFieldsResponse, ObjectContentFields } from '@mysten/sui.js';

export type NetworkType = 'testnet' | 'mainnet' | 'devnet' | 'localnet';

export type ObjectData = {
  objectId: string;
  objectType: string;
  objectVersion: number;
  objectDisplay: DisplayFieldsResponse;
  objectFields: ObjectContentFields;
};

export type SuiRpcProviderParams = {
  fullnodeUrl?: string;
  faucetUrl?: string;
  networkType?: NetworkType;
};
