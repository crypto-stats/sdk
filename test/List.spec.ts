import { expect } from 'chai';
import { Adapter } from '../src/Adapter';
import { List } from '../src/List';
import { MemoryCache } from '../src/caches/MemoryCache';

describe('List', function() {
  it('should execute a single query', async function () {
    const list = new List('test');

    const cache = new MemoryCache();
    const adapter1 = new Adapter('polymarket', { metadata: {}, cache });
    adapter1.addQuery('fee', async (num: number) => num);
    list.addAdapter(adapter1);

    const adapter2 = new Adapter('ethereum', { metadata: {}, cache });
    adapter2.addQuery('fee', async (num: number) => num * 2);
    list.addAdapter(adapter2);

    const result = await list.executeQueryWithMetadata('fee', 10);

    expect(result.length).to.equal(2);
    expect(result[0].id).to.equal('polymarket');
    expect(result[0].result).to.equal(10);
    expect(result[1].id).to.equal('ethereum');
    expect(result[1].result).to.equal(20);
  });

  it('should execute query & load metadata', async function () {
    const cache = new MemoryCache();
    const adapter = new Adapter('polymarket', {
      metadata: {
        icon: async () => 'img',
      },
      cache: cache,
    });
    adapter.addQuery('fee', async (num: number) => num);

    const list = new List('test');
    list.addAdapter(adapter);

    const result = await list.executeQueryWithMetadata('fee', 10);

    expect(result.length).to.equal(1);
    expect(result[0].result).to.equal(10);
    expect(result[0].metadata).to.deep.equal({
      icon: 'img',
    });
  });

  it('should execute queries & load metadata', async function () {
    const cache = new MemoryCache();
    const adapter = new Adapter('polymarket', {
      metadata: {
        icon: async () => 'img',
      },
      cache: cache,
    });
    adapter.addQuery('fee', async (num: number) => num);
    adapter.addQuery('tvl', async () => 100);

    const list = new List('test');
    list.addAdapter(adapter);

    const result = await list.executeQueriesWithMetadata(['fee', 'tvl'], 10);

    expect(result.length).to.equal(1);
    expect(result[0].results.fee).to.equal(10);
    expect(result[0].results.tvl).to.equal(100);
    expect(result[0].metadata).to.deep.equal({
      icon: 'img',
    });
  });
});
