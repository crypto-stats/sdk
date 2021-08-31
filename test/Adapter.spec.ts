import { expect } from 'chai';
import { Adapter } from '../src/Adapter';
import { IPFS } from '../src/libs/IPFS';
import { MemoryCache } from '../src/caches/MemoryCache';

describe('Adapter', function() {
  it('should load asyncronous data in metadata', async function () {
    this.timeout(5000);

    const ipfs = new IPFS();

    const adapter = new Adapter('polymarket', {
      metadata: {
        name: 'Polymarket',
        icon: ipfs.getDataURILoader('QmagaZMuMQKU2a5aJ2VofXBNwHmYpzo8GUR9CCjLWbgxTE', 'image/svg+xml'),
      },
    });

    const metadata = await adapter.getMetadata();

    expect(metadata).to.deep.equal({
      name: 'Polymarket',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyOCAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI2LjUxOSAzMy4yMjQyTDEuNDQ3NzUgMjYuMDYxVjkuOTQzODVMMjYuNTE5IDE3LjEwN1YzMy4yMjQyWiIgc3Ryb2tlPSIjMDEwMjAyIiBzdHJva2Utd2lkdGg9IjIuNjg2MiIvPgo8cGF0aCBkPSJNMjYuNTE5IDEuODg1MjVMMS40NDc3NSA5LjA0ODQ1VjI1LjE2NTdMMjYuNTE5IDE4LjAwMjVWMS44ODUyNVoiIHN0cm9rZT0iIzAxMDIwMiIgc3Ryb2tlLXdpZHRoPSIyLjY4NjIiLz4KPC9zdmc+Cg==',
    });
  });

  it('should save query data to the cache', async function() {
    const cache = new MemoryCache();
    const adapter = new Adapter('polymarket', {
      metadata: {},
      cache: cache,
    });
    adapter.addQuery('fee', async () => 50);

    const testDate = '2021-01-01';

    expect(await adapter.query('fee', testDate)).to.equal(50);

    expect(await cache.getValue('polymarket', 'fee', testDate)).to.equal(50);
  });

  it('should read query data from the cache', async function() {
    const testDate = '2021-01-01';
    
    const cache = new MemoryCache();
    cache.setValue('polymarket', 'fee', testDate, 100);

    const adapter = new Adapter('polymarket', {
      metadata: {},
      cache: cache,
    });

    // The adapter should NOT return 50, since it reads the cache
    adapter.addQuery('fee', async () => 50);

    expect(await adapter.query('fee', testDate)).to.equal(100);
  });

  it('should execute adapters with arbitrary numbers of parameters', async function() {
    const cache = new MemoryCache();
    const adapter = new Adapter('polymarket', {
      metadata: {},
      cache: cache,
    });

    adapter.addQuery('0params', async () => 1);
    adapter.addQuery('1param', async (a: number) => a * 2);
    adapter.addQuery('2params', async (a: number, b: number) => a * b);

    expect(await adapter.query('0params')).to.equal(1);
    expect(await adapter.query('1param', 2)).to.equal(4);
    expect(await adapter.query('2params', 2, 3)).to.equal(6);
  });

  it('should optionally allow silently allowing missing queries', async function() {
    const cache = new MemoryCache();
    const adapter = new Adapter('polymarket', {
      metadata: {},
      cache: cache,
    });

    expect(await adapter.query('missingQuery', { allowMissingQuery: true })).to.be.null;
  });
});
