import { expect } from 'chai';
import { Etherscan } from '../../src/libs/Etherscan';
import { HTTP } from '../../src/libs/HTTP';

describe('Etherscan', function() {
  const http = new HTTP();

  it('should query a balance', async function () {
    const etherscan = new Etherscan({}, http);

    const result = await etherscan.query({
      module: 'account',
      action: 'balance',
      address: '0x5AbFEc25f74Cd88437631a7731906932776356f9',
      tag: 'latest',
    });

    expect(result).to.equal('9747221377372246792');
  });
});
