import { expect } from 'chai';
import { MemoryCache } from '../../src/caches/MemoryCache';
import { CoinGecko } from '../../src/libs/CoinGecko';
import { HTTP } from '../../src/libs/HTTP';

describe('CoinGecko', function() {
  let coinGecko = new CoinGecko({
    http: new HTTP(),
    cache: new MemoryCache(),
  });

  beforeEach(() => {
    coinGecko = new CoinGecko({
      http: new HTTP(),
      cache: new MemoryCache(),
    });
  });

  it('should query the Ethereum block number', async () => {
    const result = await coinGecko.getHistoricalMarketData('bitcoin', '2021-01-01');

    expect(result).to.deep.equal({ price: 29022.41839530417, marketCap: 539438036435.6701 });
  });
});
