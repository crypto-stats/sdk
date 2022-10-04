import { expect } from 'chai';
import { MemoryCache } from '../../src/caches/MemoryCache';
import { CoinGecko } from '../../src/libs/CoinGecko';
import { HTTP } from '../../src/libs/HTTP';
import { Log } from '../../src/libs/Log';

class MockHTTP {
  public nextResult: any = null;

  async get(): Promise<any> {
    return this.nextResult;
  }
}

const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time))

describe('CoinGecko', function() {
  let coinGecko = new CoinGecko({
    http: new HTTP(),
    cache: new MemoryCache(),
    log: new Log(),
  });

  beforeEach(() => {
    coinGecko = new CoinGecko({
      http: new HTTP(),
      cache: new MemoryCache(),
      log: new Log(),
    });
  });

  it('should get historical market data', async () => {
    const result = await coinGecko.getHistoricalMarketData('bitcoin', '2021-01-01');

    expect(result).to.deep.equal({ price: 29022.41839530417, marketCap: 539438036435.6701 });
  });

  it('should get current price', async () => {
    const result = await coinGecko.getCurrentPrice('usd-coin');

    expect(result).to.be.closeTo(1, 0.001);
  });

  it('should cache current prices in memory', async () => {
    const http: any = new MockHTTP();
    coinGecko = new CoinGecko({
      http: http,
      cache: new MemoryCache(),
      log: new Log(),
      cacheExpiration: 200,
    });

    http.nextResult = { ethereum: { usd: 100 } };

    let price = await coinGecko.getCurrentPrice('ethereum');
    expect(price).to.equal(100);

    http.nextResult = { ethereum: { usd: 200 } };

    price = await coinGecko.getCurrentPrice('ethereum');
    expect(price).to.equal(100);

    await wait(200);

    price = await coinGecko.getCurrentPrice('ethereum');
    expect(price).to.equal(200);
  })
});
