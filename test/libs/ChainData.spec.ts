import { expect } from 'chai';
import { MemoryCache } from '../../src/caches/MemoryCache';
import { ChainData } from '../../src/libs/ChainData';
import { DateLib } from '../../src/libs/DateLib';
import { Graph } from '../../src/libs/Graph';
import { HTTP } from '../../src/libs/HTTP';

describe('Graph', function() {
  let chainData = new ChainData({
    graph: new Graph({ http: new HTTP() }),
    date: new DateLib(),
    cache: new MemoryCache(),
  });

  beforeEach(() => {
    chainData = new ChainData({
      graph: new Graph({ http: new HTTP() }),
      date: new DateLib(),
      cache: new MemoryCache(),
    });
  });

  it('should query the Ethereum block number', async () => {
    const result = await chainData.getBlockNumber('2021-01-01', 'ethereum');

    expect(result).to.equal(11565020);
  });

  it('should query the Polygon block number', async () => {
    const result = await chainData.getBlockNumber('2021-01-01', 'polygon');

    expect(result).to.equal(9013760);
  });

  it('should query the Avalanche block number', async () => {
    const result = await chainData.getBlockNumber('2021-01-01', 'avalanche');

    expect(result).to.equal(19133);
  });

  it('should query the Optimism block number', async () => {
    const result = await chainData.getBlockNumber('2021-07-10', 'optimism');

    expect(result).to.equal(29027);
  });
});
