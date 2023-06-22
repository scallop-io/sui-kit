import type { NetworkType as SuiNetworkType } from '../libs/suiRpcProvider/types';

export type { DerivePathParams } from '../libs/suiAccountManager/types';
export type {
  SuiTxArg,
  SuiVecTxArg,
  SuiObjectArg,
} from '../libs/suiTxBuilder/types';

export type NetworkType = SuiNetworkType;
export type SuiKitParams = {
  mnemonics?: string;
  secretKey?: string;
  fullnodeUrl?: string;
  faucetUrl?: string;
  networkType?: NetworkType;
};
