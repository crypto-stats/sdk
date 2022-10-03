import { expect } from 'chai';
import { Cosmos } from '../../src/libs/Cosmos';

const HUB_RPC = 'https://cosmos-rpc.polkachu.com/'

describe('Cosmos', function() {
  let cosmos = new Cosmos();

  beforeEach(() => {
    cosmos = new Cosmos();
  });

  it('should query the historical state of an contract by date', async function () {
    cosmos.addChain('cosmos', HUB_RPC);
    const blockNum = await cosmos.getStargateClient('cosmos').getHeight();
    await cosmos.getStargateClient('cosmos').getBlock(blockNum - 100);
  });

  it('should query the historical state of an contract by date', async function () {
    cosmos.addChain('cosmos', HUB_RPC);
    const supply = await cosmos.getQueryClient('cosmos').bank.supplyOf('uatom');
    expect(parseInt(supply.amount)).gt(310000000000000);
  });
});
