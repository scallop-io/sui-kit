import { describe, it, expect } from 'vitest';
import { ed25519PublicKeyFromBase64 } from 'src/libs/multiSig/publickey';
import { toBase64 } from '@mysten/sui/utils';

describe('ed25519PublicKeyFromBase64', () => {
  it('should return Ed25519PublicKey for 32 bytes', () => {
    const bytes = new Uint8Array(32);
    const b64 = toBase64(bytes);
    expect(() => ed25519PublicKeyFromBase64(b64)).not.toThrow();
  });

  it('should return Ed25519PublicKey for 33 bytes', () => {
    const bytes = new Uint8Array(33);
    const b64 = toBase64(bytes);
    expect(() => ed25519PublicKeyFromBase64(b64)).not.toThrow();
  });

  it('should throw for invalid length', () => {
    const bytes = new Uint8Array(10); // 不是 32 也不是 33
    const b64 = toBase64(bytes);
    expect(() => ed25519PublicKeyFromBase64(b64)).toThrow(
      'invalid pubkey length'
    );
  });
});
