import { expect } from 'chai';
import { ChainData } from '../../src/libs/ChainData';
import { Ethers } from '../../src/libs/Ethers';

const RPC = 'https://api.securerpc.com/v1';

class MockChainData {
  public blocks: { [date: string]: number } = {};

  public onGetBlockNum = (_date: string | number | Date, _chain: string) => 0;

  getBlockNumber(date: string | number | Date, chain: string = 'ethereum') {
    return this.onGetBlockNum(date, chain);
  }
}

describe('Ethers', function() {
  let chainData = new MockChainData() as unknown as ChainData;
  let ethers = new Ethers({ chainData });

  beforeEach(() => {
    chainData = new MockChainData() as unknown as ChainData;
    ethers = new Ethers({ chainData });
  });

  it('add a provider', async () => {
    ethers.addProvider('ethereum', RPC);
  });

  it('should query the historical state of an contract by date', function (pass) {
    ethers.addProvider('ethereum', RPC, { archive: true });
    const token = ethers.getERC20Contract('0xdac17f958d2ee523a2206206994597c13d831ec7', 'ethereum');

    (chainData as unknown as MockChainData).onGetBlockNum = (date: string | number | Date, chain: string) => {
      expect(date).to.equal('2019-05-15');
      expect(chain).to.equal('ethereum');
      pass();
      return 0;
    };

    token.balanceOf('0x530f953ecdc85d44fb3fc09de9b7cc3d120598a3', { blockTag: '2019-05-15' });
  });

  describe('with a network added', function() {
    beforeEach(async () => {
      ethers.addProvider('ethereum', RPC);
    });

    it('should query ERC20 values', async function () {
      const token = ethers.getERC20Contract('0xdac17f958d2ee523a2206206994597c13d831ec7', 'ethereum');

      const [name, symbol, balance] = await Promise.all([
        token.name(),
        token.symbol(),
        token.balanceOf('0x530f953ecdc85d44fb3fc09de9b7cc3d120598a3'),
      ])

      expect(name).to.equal('Tether USD');
      expect(symbol).to.equal('USDT');
      expect(balance.toString()).to.equal('524117');
    });
  });
});
