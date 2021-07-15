import { expect } from 'chai';
import { MemoryCache } from '../../src/caches/MemoryCache';

describe('MemoryCache', function() {
  let memoryCache = new MemoryCache();

  beforeEach(() => {
    memoryCache = new MemoryCache();
  });

  it('should read & write values', async () => {
    let value = await memoryCache.getValue('bitcoin', 'price', '2021-01-01');
    expect(value).to.be.null;

    await memoryCache.setValue('bitcoin', 'price', '2021-01-01', 1000);

    value = await memoryCache.getValue('bitcoin', 'price', '2021-01-01');
    expect(value).to.equal(1000);
  });
});
