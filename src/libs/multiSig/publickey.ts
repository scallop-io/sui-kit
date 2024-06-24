import { PublicKey } from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/sui/utils';

export function ed25519PublicKeyFromBase64(rawPubkey: string): PublicKey {
  let bytes = fromB64(rawPubkey);
  // rawPubkeys should either be 32 bytes or 33 bytes (with the first byte being flag)
  if (bytes.length !== 32 && bytes.length !== 33) throw 'invalid pubkey length';
  bytes = bytes.length === 33 ? bytes.slice(1) : bytes;
  return new Ed25519PublicKey(bytes);
}
