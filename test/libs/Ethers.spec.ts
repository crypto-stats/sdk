import { expect } from 'chai';
import { Ethers } from '../../src/libs/Ethers';

describe('Ethers', function() {
  let ethers = new Ethers();

  beforeEach(() => {
    ethers = new Ethers();
  });

  it('add a provider', async () => {
    ethers.addProvider('ethereum', 'https://mainnet-nethermind.blockscout.com/');
  });

  describe('with a network added', function() {
    beforeEach(async () => {
      ethers.addProvider('ethereum', 'https://mainnet-nethermind.blockscout.com/');
    });

    it('should query ERC20 values', async function () {
      const token = ethers.getERC20Contract('0xdac17f958d2ee523a2206206994597c13d831ec7', 'ethereum');

      expect(await token.name()).to.equal('Tether USD');
      expect(await token.symbol()).to.equal('USDT');
      expect((await token.balanceOf('0x530f953ecdc85d44fb3fc09de9b7cc3d120598a3')).toString()).to.equal('524117');
    });
  })
});
