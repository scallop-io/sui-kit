import { describe, it, expect } from 'vitest';
import {
  isHex,
  isBase64,
  hexOrBase64ToUint8Array,
  normalizePrivateKey,
  fromHex,
  fromBase64,
} from 'src/libs/suiAccountManager/util';

describe('isHex', () => {
  it('should return true for 0x hex', () => {
    expect(isHex('0x123abc')).toBe(true);
  });
  it('should return true for pure hex', () => {
    expect(isHex('123abc')).toBe(true);
  });
  it('should return false for non-hex', () => {
    expect(isHex('xyz')).toBe(false);
  });
});

describe('isBase64', () => {
  it('should return true for valid base64', () => {
    expect(isBase64('AQI=')).toBe(true);
  });
  it('should return false for invalid base64', () => {
    expect(isBase64('!@#$')).toBe(false);
  });
});

describe('hexOrBase64ToUint8Array', () => {
  it('should parse hex', () => {
    expect(hexOrBase64ToUint8Array('0x0102')).toEqual(new Uint8Array([1, 2]));
  });
  it('should parse base64', () => {
    expect(hexOrBase64ToUint8Array('AQI=')).toEqual(new Uint8Array([1, 2]));
  });
  it('should throw on invalid string', () => {
    expect(() => hexOrBase64ToUint8Array('!@#$')).toThrow();
  });
});

describe('normalizePrivateKey', () => {
  it('should handle legacy 64 bytes', () => {
    const arr = new Uint8Array(64).fill(1);
    expect(normalizePrivateKey(arr)).toEqual(new Uint8Array(32).fill(1));
  });
  it('should handle 33 bytes with 0 prefix', () => {
    const arr = new Uint8Array(33);
    arr[0] = 0;
    arr.fill(2, 1);
    expect(normalizePrivateKey(arr)).toEqual(new Uint8Array(32).fill(2));
  });
  it('should handle 32 bytes', () => {
    const arr = new Uint8Array(32).fill(3);
    expect(normalizePrivateKey(arr)).toEqual(arr);
  });
  it('should throw on invalid length', () => {
    expect(() => normalizePrivateKey(new Uint8Array(10))).toThrow();
  });
});

describe('fromHex (re-export)', () => {
  it('should parse valid hex', () => {
    expect(fromHex('0x0102')).toEqual(new Uint8Array([1, 2]));
  });
  it('should throw on invalid hex', () => {
    expect(() => fromHex('0xZZ')).toThrow();
  });
});

describe('fromBase64 (re-export)', () => {
  it('should parse valid base64', () => {
    expect(fromBase64('AQI=')).toEqual(new Uint8Array([1, 2]));
  });
  it('should throw on invalid base64', () => {
    expect(() => fromBase64('!@#$')).toThrow();
  });
});
