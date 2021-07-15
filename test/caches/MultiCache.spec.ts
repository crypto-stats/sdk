import { expect } from 'chai';
import { MemoryCache } from '../../src/caches/MemoryCache';
import { MultiCache } from '../../src/caches/MultiCache';

describe('MultiCache', function() {
  let cache1 = new MemoryCache();
  let cache2 = new MemoryCache();
  let cache3 = new MemoryCache();
  let multiCache = new MultiCache([cache1, cache2, cache3]);

  beforeEach(() => {
    cache1 = new MemoryCache();
    cache2 = new MemoryCache();
    cache3 = new MemoryCache();
    multiCache = new MultiCache([cache1, cache2, cache3]);
  });

  it('should return the value from the first cache', async () => {
    await cache1.setValue('bitcoin', 'price', '2021-01-01', 1000);

    const value = await multiCache.getValue('bitcoin', 'price', '2021-01-01');
    expect(value).to.equal(1000);
  });

  it('should return the value from the second cache and write the first', async () => {
    await cache2.setValue('bitcoin', 'price', '2021-01-01', 1000);

    const value = await multiCache.getValue('bitcoin', 'price', '2021-01-01');
    expect(value).to.equal(1000);

    const value1 = await cache1.getValue('bitcoin', 'price', '2021-01-01');
    expect(value1).to.equal(1000);
  });

  it('should return the value from the third cache and write the first two', async () => {
    await cache3.setValue('bitcoin', 'price', '2021-01-01', 1000);

    const value = await multiCache.getValue('bitcoin', 'price', '2021-01-01');
    expect(value).to.equal(1000);

    const value1 = await cache1.getValue('bitcoin', 'price', '2021-01-01');
    expect(value1).to.equal(1000);
    const value2 = await cache2.getValue('bitcoin', 'price', '2021-01-01');
    expect(value2).to.equal(1000);
  });

  it('should write to all 3 caches', async () => {
    await multiCache.setValue('bitcoin', 'price', '2021-01-01', 1000);

    const value1 = await cache1.getValue('bitcoin', 'price', '2021-01-01');
    expect(value1).to.equal(1000);
    const value2 = await cache2.getValue('bitcoin', 'price', '2021-01-01');
    expect(value2).to.equal(1000);
    const value3 = await cache3.getValue('bitcoin', 'price', '2021-01-01');
    expect(value3).to.equal(1000);
  });
});
