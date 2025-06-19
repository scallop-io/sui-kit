import { describe, it, expect } from 'vitest';
import {
  getDefaultSuiInputType,
  makeVecParam,
  convertArgs,
  convertAddressArg,
  convertObjArg,
  convertAmounts,
  partitionArray,
} from '../../../src/libs/suiTxBuilder/util';
import { Transaction } from '@mysten/sui/transactions';

// Mock types
const mockObjectRef = { objectId: '0x1', version: '1', digest: 'abc' };
const mockSharedObjectRef = {
  objectId: '0x2',
  initialSharedVersion: '1',
  mutable: true,
};
const mockImmOrOwnedObject = { Object: { ImmOrOwnedObject: mockObjectRef } };
const mockSharedObject = { Object: { SharedObject: mockSharedObjectRef } };

// Helper for Transaction mock
function createTx() {
  return new Transaction();
}

describe('util.ts', () => {
  describe('getDefaultSuiInputType', () => {
    it('should detect primitive types', () => {
      expect(getDefaultSuiInputType(123 as any)).toBe('u64');
      expect(getDefaultSuiInputType(BigInt(123) as any)).toBe('u64');
      expect(getDefaultSuiInputType(true as any)).toBe('bool');
      expect(getDefaultSuiInputType(false as any)).toBe('bool');
    });

    it('should detect object', () => {
      expect(
        getDefaultSuiInputType(
          '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab' as any
        )
      ).toBe('object');
    });

    it('should return undefined for unknown', () => {
      expect(getDefaultSuiInputType({} as any)).toBeUndefined();
      expect(getDefaultSuiInputType('not-an-object-id' as any)).toBeUndefined();
    });
  });

  describe('makeVecParam', () => {
    it('should throw on empty array', () => {
      const tx = createTx();
      expect(() => makeVecParam(tx, [], 'u64')).toThrow();
    });

    it('should handle object type', () => {
      const tx = createTx();
      const objIds = [
        '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
        '0x24c0247fb22457a719efac7f670cdc79be321b521460bd6bd2ccfa9f80713b14',
        '0x7c5b7837c44a69b469325463ac0673ac1aa8435ff44ddb4191c9ae380463647f',
        '0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469',
        '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2',
        '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
      ];
      const arr = objIds.map((id) => tx.object(id));
      const result = makeVecParam(tx, arr, 'object');
      expect(result).toBeDefined();
    });

    it('should handle u64 type', () => {
      const tx = createTx();
      const arr = [1, 2];
      const result = makeVecParam(tx, arr as any[], 'u64');
      expect(result).toBeDefined();
    });
  });

  describe('convertArgs', () => {
    it('should handle SerializedBcs', () => {
      const tx = createTx();
      const arg = tx.pure.u8(1);
      expect(convertArgs(tx, [arg])[0]).toBeDefined();
    });

    it('should handle move vec arg (array)', () => {
      const tx = createTx();
      const arg = [1, 2].map((n) => tx.pure.u64(n));
      expect(convertArgs(tx, [arg])[0]).toBeDefined();
    });

    it('should handle amount arg', () => {
      const tx = createTx();
      const arg = tx.pure.u64(123);
      expect(convertArgs(tx, [arg])[0]).toBeDefined();
    });

    it('should handle TransactionArgument as object arg', () => {
      const tx = createTx();
      const arg = tx.pure.u64(1);
      expect(convertArgs(tx, [arg])[0]).toBeDefined();
    });
  });

  describe('convertAddressArg', () => {
    it('should handle valid address', () => {
      const tx = createTx();
      expect(
        convertAddressArg(
          tx,
          '0xd9612ec5cb1d13bcd955ad4b8936d41824dc478a37bff6b0619e994279def7f3'
        )
      ).toBeDefined();
    });

    it('should handle TransactionArgument', () => {
      const tx = createTx();
      const arg = tx.pure.address(
        '0xd9612ec5cb1d13bcd955ad4b8936d41824dc478a37bff6b0619e994279def7f3'
      );
      expect(convertAddressArg(tx, arg)).toBeDefined();
    });
  });

  describe('convertObjArg', () => {
    it('should handle string', () => {
      const tx = createTx();
      expect(
        convertObjArg(
          tx,
          '0xd9612ec5cb1d13bcd955ad4b8936d41824dc478a37bff6b0619e994279def7f3'
        )
      ).toBeDefined();
    });

    it('should handle object ref', () => {
      const tx = createTx();
      expect(convertObjArg(tx, mockObjectRef)).toBeDefined();
    });

    it('should handle shared object ref', () => {
      const tx = createTx();
      expect(convertObjArg(tx, mockSharedObjectRef)).toBeDefined();
    });

    it('should handle ImmOrOwnedObject', () => {
      const tx = createTx();
      expect(convertObjArg(tx, mockImmOrOwnedObject)).toBeDefined();
    });

    it('should handle SharedObject', () => {
      const tx = createTx();
      expect(convertObjArg(tx, mockSharedObject)).toBeDefined();
    });

    it('should handle function', () => {
      const tx = createTx();
      const fn = () =>
        tx.object(
          '0xd9612ec5cb1d13bcd955ad4b8936d41824dc478a37bff6b0619e994279def7f3'
        );
      expect(convertObjArg(tx, fn)).toBe(fn);
    });

    it('should handle special objects', () => {
      const tx = createTx();
      expect(convertObjArg(tx, { GasCoin: true })).toBeDefined();
    });

    it('should throw on invalid type', () => {
      const tx = createTx();
      expect(() => convertObjArg(tx, {} as any)).toThrow();
    });
  });

  describe('convertAmounts', () => {
    it('should handle amount arg (number)', () => {
      const tx = createTx();
      expect(convertAmounts(tx, [tx.pure.u64(123)])).toHaveLength(1);
    });

    it('should handle amount arg (TransactionArgument)', () => {
      const tx = createTx();
      const arg = tx.pure.u64(1);
      expect(convertAmounts(tx, [arg])).toHaveLength(1);
    });
  });

  describe('partitionArray', () => {
    it('should partition array correctly', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = partitionArray(arr, 2);
      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(2);
      expect(result[2]).toHaveLength(1);
    });
  });
});
