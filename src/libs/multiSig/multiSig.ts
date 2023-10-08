import { blake2b } from '@noble/hashes/blake2b';
import { bytesToHex } from '@noble/hashes/utils';

import { Ed25519PublicKey } from '@mysten/sui.js/keypairs/ed25519';
import { Secp256r1PublicKey } from '@mysten/sui.js/keypairs/secp256r1';
import { Secp256k1PublicKey } from '@mysten/sui.js/keypairs/secp256k1';
import {
  MAX_SIGNER_IN_MULTISIG,
  MIN_SIGNER_IN_MULTISIG,
} from '@mysten/sui.js/multisig';
import { fromB64, toB64, normalizeSuiAddress } from '@mysten/sui.js/utils';
import {
  SIGNATURE_SCHEME_TO_FLAG,
  SIGNATURE_FLAG_TO_SCHEME,
  PublicKey,
  SignatureScheme,
  SerializedSignature,
} from '@mysten/sui.js/cryptography';

import { bcs } from '../bcs';

/**
 * Pair of signature and corresponding public key
 */
export type SignaturePubkeyPair = {
  signatureScheme: SignatureScheme;
  /** Base64-encoded signature */
  signature: Uint8Array;
  /** Base64-encoded public key */
  pubKey: PublicKey;
  weight?: number;
};

export type PubkeyWeightPair = {
  pubKey: PublicKey;
  weight: number;
};

export type CompressedSignature =
  | { ED25519: number[] }
  | { Secp256k1: number[] }
  | { Secp256r1: number[] };

export type PublicKeyEnum =
  | { ED25519: number[] }
  | { Secp256k1: number[] }
  | { Secp256r1: number[] };

export type PubkeyEnumWeightPair = {
  pubKey: PublicKeyEnum;
  weight: number;
};

export type MultiSigPublicKey = {
  pk_map: PubkeyEnumWeightPair[];
  threshold: number;
};

export type MultiSig = {
  sigs: CompressedSignature[];
  bitmap: number;
  multisig_pk: MultiSigPublicKey;
};

/// Derives a multisig address from a list of pk and weights and threshold.
// It is the 32-byte Blake2b hash of the serializd bytes of `flag_MultiSig || threshold || flag_1 || pk_1 || weight_1
/// || ... || flag_n || pk_n || weight_n`
export function toMultiSigAddress(
  pks: PubkeyWeightPair[],
  threshold: number
): string {
  if (pks.length > MAX_SIGNER_IN_MULTISIG) {
    throw new Error(
      `Max number of signers in a multisig is ${MAX_SIGNER_IN_MULTISIG}`
    );
  }
  if (pks.length < MIN_SIGNER_IN_MULTISIG) {
    throw new Error(
      `Min number of signers in a multisig is ${MIN_SIGNER_IN_MULTISIG}`
    );
  }

  const maxLength = 1 + 2 + pks.length * (1 + 64 + 1);
  const buf = new Uint8Array(maxLength);

  let offset = 0;

  // flag_MultiSig
  buf.set([SIGNATURE_SCHEME_TO_FLAG.MultiSig], offset);
  offset += 1;

  // threshold, convert u16 to little endian
  buf.set([threshold & 0xff, threshold >> 8], offset);
  offset += 2;

  // flag_1 || pk_1 || weight_1 || ... || flag_n || pk_n || weight_n
  let totalWeight = 0;
  for (let i = 0; i < pks.length; i++) {
    const { pubKey, weight } = pks[i];
    const flag = pubKey.flag();
    buf.set([flag], offset);
    offset += 1;
    buf.set(pubKey.toRawBytes(), offset);
    offset += pubKey.toRawBytes().length;
    buf.set([weight], offset);
    offset += 1;

    totalWeight += weight;
  }

  // Make sure the total weight is greater than or equal to the threshold
  if (totalWeight < threshold) {
    throw new Error(`Total weight is less than threshold`);
  }

  // Hash the serialized bytes
  const bufHash = blake2b(buf.slice(0, offset), { dkLen: 32 });

  // Return the normalized address
  return normalizeSuiAddress(bytesToHex(bufHash));
}

export function combinePartialSigs(
  sigs: SerializedSignature[],
  pks: PubkeyWeightPair[],
  threshold: number
): SerializedSignature {
  if (sigs.length > MAX_SIGNER_IN_MULTISIG) {
    throw new Error(
      `Max number of signers in a multisig is ${MAX_SIGNER_IN_MULTISIG}`
    );
  }

  const multiSigPk: MultiSigPublicKey = {
    pk_map: pks.map((pk) => toPkEnumWeightPair(pk)),
    threshold,
  };

  let bitmap = 0;
  const compressedSigs: CompressedSignature[] = new Array(sigs.length);
  for (let i = 0; i < sigs.length; i++) {
    const parsed = toSingleSignaturePubkeyPair(sigs[i]);
    const bytes = Array.from(parsed.signature.map((x) => Number(x)));
    if (parsed.signatureScheme === 'ED25519') {
      compressedSigs[i] = { ED25519: bytes };
    } else if (parsed.signatureScheme === 'Secp256k1') {
      compressedSigs[i] = { Secp256k1: bytes };
    } else if (parsed.signatureScheme === 'Secp256r1') {
      compressedSigs[i] = { Secp256r1: bytes };
    }
    for (let j = 0; j < pks.length; j++) {
      if (parsed.pubKey.equals(pks[j].pubKey)) {
        bitmap |= 1 << j;
        break;
      }
    }
  }
  const multiSig: MultiSig = {
    sigs: compressedSigs,
    bitmap,
    multisig_pk: multiSigPk,
  };

  const bytes = bcs.MultiSig.serialize(multiSig).toBytes();
  const tmp = new Uint8Array(bytes.length + 1);
  tmp.set([SIGNATURE_SCHEME_TO_FLAG.MultiSig], 0);
  tmp.set(bytes, 1);
  return toB64(tmp);
}

function toPkEnumWeightPair(pair: PubkeyWeightPair): PubkeyEnumWeightPair {
  const pk_bytes = Array.from(pair.pubKey.toBytes().map((x) => Number(x)));
  switch (pair.pubKey.flag()) {
    case SIGNATURE_SCHEME_TO_FLAG['Secp256k1']:
      return {
        pubKey: {
          Secp256k1: pk_bytes,
        },
        weight: pair.weight,
      };
    case SIGNATURE_SCHEME_TO_FLAG['Secp256r1']:
      return {
        pubKey: {
          Secp256r1: pk_bytes,
        },
        weight: pair.weight,
      };
    case SIGNATURE_SCHEME_TO_FLAG['ED25519']:
      return {
        pubKey: {
          ED25519: pk_bytes,
        },
        weight: pair.weight,
      };
    default:
      throw new Error('Unsupported signature scheme');
  }
}

function toSingleSignaturePubkeyPair(
  serializedSignature: SerializedSignature
): SignaturePubkeyPair {
  const res = toParsedSignaturePubkeyPair(serializedSignature);
  if (res.length !== 1) {
    throw Error('Expected a single signature');
  }
  return res[0];
}

/// Expects to parse a serialized signature by its signature scheme to a list of signature
/// and public key pairs. The list is of length 1 if it is not multisig.
function toParsedSignaturePubkeyPair(
  serializedSignature: SerializedSignature
): SignaturePubkeyPair[] {
  const bytes = fromB64(serializedSignature);
  const signatureScheme =
    SIGNATURE_FLAG_TO_SCHEME[bytes[0] as keyof typeof SIGNATURE_FLAG_TO_SCHEME];

  if (signatureScheme === 'Zk') {
    throw new Error('Zk signature not supported');
  }
  if (signatureScheme === 'MultiSig') {
    throw new Error('MultiSig signature not supported');
  }

  const SIGNATURE_SCHEME_TO_PUBLIC_KEY = {
    ED25519: Ed25519PublicKey,
    Secp256k1: Secp256k1PublicKey,
    Secp256r1: Secp256r1PublicKey,
  };

  const PublicKey = SIGNATURE_SCHEME_TO_PUBLIC_KEY[signatureScheme];

  const signature = bytes.slice(1, bytes.length - PublicKey.SIZE);
  const pubKeyBytes = bytes.slice(1 + signature.length);
  const pubKey = new PublicKey(pubKeyBytes);

  return [
    {
      signatureScheme,
      signature,
      pubKey,
    },
  ];
}

/// Decode a multisig signature into a list of flags, signatures and public keys.
export function decodeMultiSig(signature: string): SignaturePubkeyPair[] {
  const bytes = fromB64(signature);
  if (bytes.length < 1 || bytes[0] !== SIGNATURE_SCHEME_TO_FLAG.MultiSig) {
    throw new Error('Invalid MultiSig flag');
  }

  const multiSig: MultiSig = bcs.MultiSig.parse(bytes.slice(1));
  const bitmapArr = asIndices(multiSig.bitmap);
  const res: SignaturePubkeyPair[] = new Array(multiSig.sigs.length);
  for (let i = 0; i < multiSig.sigs.length; i++) {
    const s: CompressedSignature = multiSig.sigs[i];
    const pkIdx = bitmapArr[i];
    const pkEnum = multiSig.multisig_pk.pk_map[pkIdx].pubKey;
    const pk = Object.values(pkEnum)[0];
    const scheme = Object.keys(s)[0] as SignatureScheme;
    const weight = multiSig.multisig_pk.pk_map[pkIdx].weight;

    if (scheme === 'MultiSig') {
      throw new Error('MultiSig is not supported inside MultiSig');
    }
    const SIGNATURE_SCHEME_TO_PUBLIC_KEY = {
      ED25519: Ed25519PublicKey,
      Secp256k1: Secp256k1PublicKey,
      Secp256r1: Secp256r1PublicKey,
    };
    const PublicKey = SIGNATURE_SCHEME_TO_PUBLIC_KEY[scheme];
    res[i] = {
      signatureScheme: scheme,
      signature: Uint8Array.from(Object.values(s)[0]),
      pubKey: new PublicKey(pk),
      weight,
    };
  }
  return res;
}

function asIndices(bitmap: number): number[] {
  if (bitmap < 0 || bitmap > 1024) {
    throw new Error('Invalid bitmap');
  }
  const res: number[] = [];
  for (let i = 0; i < 10; i++) {
    if (bitmap & (1 << i)) {
      res.push(i);
    }
  }
  return res;
}
