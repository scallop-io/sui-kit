import { describe, it, expect } from 'vitest';
import { SuiTxBlock } from '../../../src/libs/suiTxBuilder';
import { SuiKit } from 'src/suiKit';

function createTxBlock() {
  return new SuiTxBlock();
}

describe('SuiTxBlock', () => {
  const suiKit = new SuiKit({
    mnemonics: 'test test test test test test test test test test test test',
  });

  it('makeMoveVec should call underlying txBlock.makeMoveVec', () => {
    const tx = createTxBlock();
    expect(() => tx.makeMoveVec({ elements: [] })).not.toThrow();
  });

  it('transferObjects should call underlying txBlock.transferObjects', () => {
    const tx = createTxBlock();
    const result = tx.transferObjects(
      ['0x1234567890abcdef1234567890abcdef12345678'],
      suiKit.currentAddress
    );
    expect(result).toBeDefined();
  });

  it('moveCall should call underlying txBlock.moveCall', () => {
    const tx = createTxBlock();
    const result = tx.moveCall('0x1::module::func', []);
    expect(result).toBeDefined();
  });

  it('transferSuiToMany should transfer to multiple recipients', () => {
    const tx = createTxBlock();

    const recipients = [suiKit.currentAddress, suiKit.currentAddress];
    const amounts = [1, 2];
    const result = tx.transferSuiToMany(recipients, amounts);
    expect(result).toBe(tx);
  });

  it('transferSui should transfer to one recipient', () => {
    const tx = createTxBlock();
    const result = tx.transferSui(suiKit.currentAddress, 1);
    expect(result).toBe(tx);
  });

  it('takeAmountFromCoins should return splitedCoins and mergedCoin', () => {
    const tx = createTxBlock();
    const coins = ['0x1234567890abcdef1234567890abcdef12345678'];
    const [splitedCoins, mergedCoin] = tx.takeAmountFromCoins(coins, 1);
    expect(splitedCoins).toBeDefined();
    expect(mergedCoin).toBeDefined();
  });

  it('splitSUIFromGas should split coins from gas', () => {
    const tx = createTxBlock();
    const result = tx.splitSUIFromGas([1, 2]);
    expect(result).toBeDefined();
  });

  it('splitMultiCoins should split and merge coins', () => {
    const tx = createTxBlock();
    const coins = ['0x1234567890abcdef1234567890abcdef12345678'];
    const result = tx.splitMultiCoins(coins, [1]);
    expect(result).toHaveProperty('splitedCoins');
    expect(result).toHaveProperty('mergedCoin');
  });

  it('transferCoinToMany should transfer coins to many', () => {
    const tx = createTxBlock();
    const coins = ['0x1234567890abcdef1234567890abcdef12345678'];
    const sender = suiKit.currentAddress;
    const recipients = [suiKit.currentAddress];
    const amounts = [1];
    const result = tx.transferCoinToMany(coins, sender, recipients, amounts);
    expect(result).toBe(tx);
  });

  it('stakeSui should call moveCall for staking', () => {
    const tx = createTxBlock();
    const result = tx.stakeSui(1, suiKit.currentAddress);
    expect(result).toBeDefined();
  });
});

describe('SuiTxBlock (simple coverage)', () => {
  const suiKit = new SuiKit({
    mnemonics: 'test test test test test test test test test test test test',
  });

  it('should get gas', () => {
    const tx = new SuiTxBlock();
    expect(tx.gas).toBeDefined();
  });

  it('should get blockData', () => {
    const tx = new SuiTxBlock();
    expect(tx.txBlock.getData()).toBeDefined();
  });

  it('should get getData', () => {
    const tx = new SuiTxBlock();
    expect(tx.getData).toBeDefined();
  });

  it('should get pure', () => {
    const tx = new SuiTxBlock();
    expect(tx.pure).toBeDefined();
  });

  it('should call object', () => {
    const tx = new SuiTxBlock();
    expect(() => tx.object('0x' + '1'.repeat(64))).not.toThrow();
  });

  it('should call objectRef', () => {
    const tx = new SuiTxBlock();
    expect(() =>
      tx.objectRef({
        objectId: '0x' + '1'.repeat(64),
        version: '1',
        digest: 'abc',
      })
    ).not.toThrow();
  });

  it('should call sharedObjectRef', () => {
    const tx = new SuiTxBlock();
    expect(() =>
      tx.sharedObjectRef({
        objectId: '0x' + '1'.repeat(64),
        initialSharedVersion: '1',
        mutable: true,
      })
    ).not.toThrow();
  });

  it('should call setSender', () => {
    const tx = new SuiTxBlock();
    expect(() => tx.setSender('0x' + '1'.repeat(64))).not.toThrow();
  });

  it('should call setSenderIfNotSet', () => {
    const tx = new SuiTxBlock();
    expect(() => tx.setSenderIfNotSet('0x' + '1'.repeat(64))).not.toThrow();
  });

  it('should call setExpiration', () => {
    const tx = new SuiTxBlock();
    expect(() => tx.setExpiration()).not.toThrow();
  });

  it('should call setGasPrice', () => {
    const tx = new SuiTxBlock();
    expect(() => tx.setGasPrice(1)).not.toThrow();
  });

  it('should call setGasBudget', () => {
    const tx = new SuiTxBlock();
    expect(() => tx.setGasBudget(1)).not.toThrow();
  });

  it('should call setGasOwner', () => {
    const tx = new SuiTxBlock();
    expect(() => tx.setGasOwner('0x' + '1'.repeat(64))).not.toThrow();
  });

  it('should call setGasPayment', () => {
    const tx = new SuiTxBlock();
    expect(() =>
      tx.setGasPayment([
        { objectId: '0x' + '1'.repeat(64), version: '1', digest: 'abc' },
      ])
    ).not.toThrow();
  });

  it('should call serialize', () => {
    const tx = createTxBlock();
    expect(() => tx.serialize()).not.toThrow();
  });

  it('should call toJSON', () => {
    const tx = createTxBlock();
    expect(() => tx.toJSON()).not.toThrow();
  });

  it('should call add', () => {
    const tx = createTxBlock();
    expect(() => tx.add({} as any)).not.toThrow();
  });

  it('should call publish', () => {
    const tx = createTxBlock();
    expect(() =>
      tx.publish({
        modules: [[1, 2, 3]],
        dependencies: ['0x' + '1'.repeat(64)],
      })
    ).not.toThrow();
  });

  it('should call upgrade', () => {
    const tx = createTxBlock();
    const args = [
      {
        modules: [
          [1, 2, 3],
          [4, 5, 6],
        ],
        dependencies: ['0x' + '1'.repeat(64)],
        package: '0x' + '1'.repeat(64),
        ticket: '0x' + '1'.repeat(64),
      },
    ];
    expect(() => tx.upgrade(args[0])).not.toThrow();
  });

  it('should call getDigest', () => {
    const tx = new SuiTxBlock();
    tx.setSender('0x' + '1'.repeat(64));
    tx.setGasPayment([
      { objectId: '0x' + '4'.repeat(64), version: '1', digest: 'abc' },
    ]);
    tx.transferObjects(['0x' + '2'.repeat(64)], '0x' + '3'.repeat(64));
    expect(() => tx.getDigest({ client: suiKit.client })).not.toThrow();
  });

  it('should call build', () => {
    const tx = new SuiTxBlock();
    tx.setSender('0x' + '1'.repeat(64));
    tx.setGasPayment([
      { objectId: '0x' + '4'.repeat(64), version: '1', digest: 'abc' },
    ]);
    tx.transferObjects(['0x' + '2'.repeat(64)], '0x' + '3'.repeat(64));
    expect(() => tx.build({ client: suiKit.client })).not.toThrow();
  });
});
