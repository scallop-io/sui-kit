import { SuiSharedObject } from 'src/libs/suiModel/suiSharedObject.js';
import { describe, it, expect } from 'vitest';

describe('SuiSharedObject', () => {
  it('should initialize with objectId', () => {
    const obj = new SuiSharedObject({ objectId: '0xabc' });
    expect(obj.objectId).toBe('0xabc');
    expect(obj.initialSharedVersion).toBeUndefined();
  });

  it('should initialize with objectId and initialSharedVersion', () => {
    const obj = new SuiSharedObject({
      objectId: '0xabc',
      initialSharedVersion: '1',
    });
    expect(obj.objectId).toBe('0xabc');
    expect(obj.initialSharedVersion).toBe('1');
  });

  it('asCallArg returns objectId if initialSharedVersion is missing', () => {
    const obj = new SuiSharedObject({ objectId: '0xabc' });
    expect(obj.asCallArg()).toBe('0xabc');
  });

  it('asCallArg returns correct CallArg with default mutable=false', () => {
    const obj = new SuiSharedObject({
      objectId: '0xabc',
      initialSharedVersion: '1',
    });
    expect(obj.asCallArg()).toEqual({
      $kind: 'Object',
      Object: {
        $kind: 'SharedObject',
        SharedObject: {
          objectId: '0xabc',
          initialSharedVersion: '1',
          mutable: false,
        },
      },
    });
  });

  it('asCallArg returns correct CallArg with mutable=true', () => {
    const obj = new SuiSharedObject({
      objectId: '0xabc',
      initialSharedVersion: '1',
    });
    expect(obj.asCallArg(true)).toEqual({
      $kind: 'Object',
      Object: {
        $kind: 'SharedObject',
        SharedObject: {
          objectId: '0xabc',
          initialSharedVersion: '1',
          mutable: true,
        },
      },
    });
  });
});
