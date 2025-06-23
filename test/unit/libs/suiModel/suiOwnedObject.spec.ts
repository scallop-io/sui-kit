import { describe, it, expect } from 'vitest';
import { SuiOwnedObject } from '../../../../src/libs/suiModel/suiOwnedObject';

describe('SuiOwnedObject', () => {
  it('should initialize with objectId', () => {
    const obj = new SuiOwnedObject({ objectId: '0x123' });
    expect(obj.objectId).toBe('0x123');
    expect(obj.version).toBeUndefined();
    expect(obj.digest).toBeUndefined();
  });

  it('isFullObject returns false if missing version or digest', () => {
    const obj = new SuiOwnedObject({ objectId: '0x123' });
    expect(obj.isFullObject()).toBe(false);
    obj.version = '1';
    expect(obj.isFullObject()).toBe(false);
    obj.digest = 'abc';
    expect(obj.isFullObject()).toBe(true);
  });

  it('asCallArg returns objectId if not full', () => {
    const obj = new SuiOwnedObject({ objectId: '0x123' });
    expect(obj.asCallArg()).toBe('0x123');
  });

  it('asCallArg returns CallArg if full', () => {
    const obj = new SuiOwnedObject({
      objectId: '0x123',
      version: '1',
      digest: 'abc',
    });
    expect(obj.asCallArg()).toEqual({
      $kind: 'Object',
      Object: {
        $kind: 'ImmOrOwnedObject',
        ImmOrOwnedObject: {
          objectId: '0x123',
          version: '1',
          digest: 'abc',
        },
      },
    });
  });

  it('updateFromTxResponse updates version and digest', () => {
    const obj = new SuiOwnedObject({ objectId: '0x123' });
    const txResponse = {
      objectChanges: [
        { type: 'mutated', objectId: '0x123', version: '2', digest: 'def' },
      ],
    } as any;
    obj.updateFromTxResponse(txResponse);
    expect(obj.version).toBe('2');
    expect(obj.digest).toBe('def');
  });

  it('updateFromTxResponse throws if object not found', () => {
    const obj = new SuiOwnedObject({ objectId: '0x123' });
    const txResponse = {
      objectChanges: [
        { type: 'mutated', objectId: '0x456', version: '2', digest: 'def' },
      ],
    } as any;
    expect(() => obj.updateFromTxResponse(txResponse)).toThrow();
  });

  it('updateFromTxResponse throws if no objectChanges', () => {
    const obj = new SuiOwnedObject({ objectId: '0x123' });
    const txResponse = {} as any;
    expect(() => obj.updateFromTxResponse(txResponse)).toThrow();
  });
});
