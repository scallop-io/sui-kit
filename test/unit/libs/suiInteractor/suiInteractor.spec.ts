import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuiInteractor } from 'src/libs/suiInteractor/suiInteractor';
import { SuiOwnedObject, SuiSharedObject } from 'src/libs/suiModel';

vi.mock('src/libs/suiInteractor/util', () => ({
  delay: vi.fn(() => Promise.resolve()),
  batch: vi.fn((arr, size) => {
    const batches = [];
    for (let i = 0; i < arr.length; i += size) {
      batches.push(arr.slice(i, i + size));
    }
    return batches;
  }),
}));

vi.mock('@mysten/sui/client', () => {
  return {
    SuiClient: vi.fn().mockImplementation(({ url }) => {
      const client: any = {
        url,
        executeTransactionBlock: vi.fn(),
        dryRunTransactionBlock: vi.fn(),
        multiGetObjects: vi.fn(),
        getCoins: vi.fn(),
      };
      return client;
    }),
    getFullnodeUrl: vi.fn(() => 'mocked-url'),
  };
});

describe('SuiInteractor', () => {
  let interactor: SuiInteractor;
  let client0: any, client1: any;

  beforeEach(() => {
    interactor = new SuiInteractor({ fullnodeUrls: ['url1', 'url2'] });
    client0 = interactor['clients'][0];
    client1 = interactor['clients'][1];
  });

  it('should construct with suiClients param', () => {
    const fakeClient = { foo: 'bar' };
    const i = new SuiInteractor({ suiClients: [fakeClient as any] });
    expect(i['clients'][0]).toBe(fakeClient);
    expect(i.currentClient).toBe(fakeClient);
  });

  it('should switch to next client', () => {
    const first = interactor.currentClient;
    interactor.switchToNextClient();
    expect(interactor.currentClient).not.toBe(first);
    interactor.switchToNextClient();
    expect(interactor.currentClient).toBe(first);
  });

  it('should switch full nodes', () => {
    interactor.switchFullNodes(['a', 'b']);
    expect(interactor['fullNodes']).toEqual(['a', 'b']);
    expect(interactor['clients'].length).toBe(2);
    expect(interactor.currentClient).toBe(interactor['clients'][0]);
  });

  it('should throw if switchFullNodes is called with empty array', () => {
    expect(() => interactor.switchFullNodes([])).toThrow(
      'fullNodes cannot be empty'
    );
  });

  it('should throw if currentFullNode is called with no fullNodes', () => {
    interactor['fullNodes'] = [];
    expect(() => interactor.currentFullNode).toThrow('No full nodes available');
  });

  it('should throw if current client not found', () => {
    interactor['clients'] = [];
    expect(() => interactor.currentFullNode).toThrow(
      'Current client not found'
    );
  });

  it('should try all clients and throw if all fail in sendTx', async () => {
    client0.executeTransactionBlock.mockRejectedValue(new Error('fail'));
    client1.executeTransactionBlock.mockRejectedValue(new Error('fail'));
    await expect(interactor.sendTx('tx', 'sig')).rejects.toThrow(
      'Failed to send transaction with all fullnodes'
    );
  });

  it('should return result if a client succeeds in sendTx', async () => {
    client0.executeTransactionBlock.mockRejectedValue(new Error('fail'));
    client1.executeTransactionBlock.mockResolvedValue('ok');
    await expect(interactor.sendTx('tx', 'sig')).resolves.toBe('ok');
  });

  it('should try all clients and throw if all fail in dryRunTx', async () => {
    client0.dryRunTransactionBlock.mockRejectedValue(new Error('fail'));
    client1.dryRunTransactionBlock.mockRejectedValue(new Error('fail'));
    await expect(interactor.dryRunTx(new Uint8Array())).rejects.toThrow(
      'Failed to dry run transaction with all fullnodes'
    );
  });

  it('should return result if a client succeeds in dryRunTx', async () => {
    client0.dryRunTransactionBlock.mockRejectedValue(new Error('fail'));
    client1.dryRunTransactionBlock.mockResolvedValue('ok');
    await expect(interactor.dryRunTx(new Uint8Array())).resolves.toBe('ok');
  });

  it('should get objects from multiGetObjects', async () => {
    client0.multiGetObjects.mockResolvedValue([{ data: { objectId: 'a' } }]);
    const res = await interactor.getObjects(['a']);
    expect(res).toEqual([{ objectId: 'a' }]);
  });

  it('should filter out null/undefined objects in getObjects', async () => {
    client0.multiGetObjects.mockResolvedValue([
      { data: null },
      { data: undefined },
      { data: { objectId: 'b' } },
    ]);
    const res = await interactor.getObjects(['b']);
    expect(res).toEqual([{ objectId: 'b' }]);
  });

  it('should throw if all clients fail in getObjects', async () => {
    client0.multiGetObjects.mockRejectedValue(new Error('fail'));
    client1.multiGetObjects.mockRejectedValue(new Error('fail'));
    await expect(interactor.getObjects(['id1'])).rejects.toThrow(
      'Failed to get objects with all fullnodes'
    );
  });

  it('should call getObjects and return first in getObject', async () => {
    const obj = { objectId: 'x' };
    interactor.getObjects = vi.fn().mockResolvedValue([obj]);
    const res = await interactor.getObject('x');
    expect(res).toBe(obj);
    expect(interactor.getObjects).toHaveBeenCalledWith(['x'], undefined);
  });

  it('should update SuiSharedObject initialSharedVersion', async () => {
    const sharedObj = new SuiSharedObject({ objectId: 'id1' });
    interactor.getObjects = vi
      .fn()
      .mockResolvedValue([
        { objectId: 'id1', owner: { Shared: { initial_shared_version: 123 } } },
      ]);
    await interactor.updateObjects([sharedObj]);
    expect(sharedObj.initialSharedVersion).toBe(123);
  });

  it('should set SuiSharedObject initialSharedVersion to undefined if not Shared', async () => {
    const sharedObj = new SuiSharedObject({ objectId: 'id1' });
    interactor.getObjects = vi
      .fn()
      .mockResolvedValue([{ objectId: 'id1', owner: { NotShared: {} } }]);
    await interactor.updateObjects([sharedObj]);
    expect(sharedObj.initialSharedVersion).toBeUndefined();
  });

  it('should update SuiOwnedObject version and digest', async () => {
    const ownedObj = new SuiOwnedObject({ objectId: 'id2' });
    interactor.getObjects = vi
      .fn()
      .mockResolvedValue([{ objectId: 'id2', version: 'v1', digest: 'd1' }]);
    await interactor.updateObjects([ownedObj]);
    expect(ownedObj.version).toBe('v1');
    expect(ownedObj.digest).toBe('d1');
  });

  it('should select coins and sum up to amount', async () => {
    client0.getCoins = vi.fn().mockResolvedValueOnce({
      data: [
        { coinObjectId: 'a', digest: 'd', version: '1', balance: '60' },
        { coinObjectId: 'b', digest: 'e', version: '2', balance: '50' },
      ],
      hasNextPage: false,
      nextCursor: null,
    });
    interactor.currentClient = client0;
    const coins = await interactor.selectCoins('addr', 100);
    expect(coins.length).toBe(2);
    expect(coins[0].objectId).toBe('a');
    expect(coins[1].objectId).toBe('b');
  });

  it('should throw if no coins found in selectCoins', async () => {
    client0.getCoins = vi
      .fn()
      .mockResolvedValue({ data: [], hasNextPage: false });
    interactor.currentClient = client0;
    await expect(interactor.selectCoins('addr', 100)).rejects.toThrow(
      'No valid coins found for the transaction.'
    );
  });
});
