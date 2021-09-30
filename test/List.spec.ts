import { expect } from 'chai';
import { BaseCryptoStatsSDK } from '../src/BaseCryptoStatsSDK';
import { List } from '../src/List';

const POLYGON_MODULE_CODE = `
  module.exports.name = 'Polymarket';
  module.exports.version = '1.0.1';

  module.exports.setup = function setup(context) {
    context.register({
      id: 'polymarket',
      bundle: 'my-bundle',
      metadata: {
        name: 'Polymarket',
      },
    });
  }
`;

describe('List', function() {
  it('should execute a single query', async function () {
    const list = new List('test');

    list.addAdapter({
      id: 'polymarket',
      queries: {
        fee: async (num: number) => num,
      },
      metadata: {},
    });

    list.addAdapter({
      id: 'ethereum',
      queries: {
        fee: async (num: number) => num * 2,
      },
      metadata: {},
    });

    const result = await list.executeQueryWithMetadata('fee', 10);

    expect(result.length).to.equal(2);
    expect(result[0].id).to.equal('polymarket');
    expect(result[0].result).to.equal(10);
    expect(result[1].id).to.equal('ethereum');
    expect(result[1].result).to.equal(20);
  });

  it('should execute query & load metadata', async function () {
    const list = new List('test');
    list.addAdapter({
      id: 'polymarket',
      queries: {
        fee: async (num: number) => num,
      },
      metadata: {
        icon: async () => 'img',
      },
    });

    const result = await list.executeQueryWithMetadata('fee', 10);

    expect(result.length).to.equal(1);
    expect(result[0].result).to.equal(10);
    expect(result[0].metadata).to.deep.equal({
      icon: 'img',
    });
  });

  it('should execute queries & load metadata', async function () {
    const list = new List('test');
    list.addAdapter({
      id: 'polymarket',
      queries: {
        fee: async (num: number) => num,
        tvl: async () => 100,
      },
      metadata: {
        icon: async () => 'img',
      },
    });

    const result = await list.executeQueriesWithMetadata(['fee', 'tvl'], 10);

    expect(result.length).to.equal(1);
    expect(result[0].results.fee).to.equal(10);
    expect(result[0].results.tvl).to.equal(100);
    expect(result[0].metadata).to.deep.equal({
      icon: 'img',
    });
  });

  it('should fetch modules', async function() {
    const sdk = {
      http: {
        async get(url: string) {
          expect(url).to.equal('https://cryptostats.community/api/list/test');
          return { success: true, result: ['myCID'] };
        }
      },
      ipfs: {
        getFile(cid: string) {
          expect(cid).to.equal('myCID');
          return POLYGON_MODULE_CODE;
        },
      },
      getContext(_list: List) {
        return {
          register(registration: any) {
            _list.addAdapter(registration);
          }
        };
      },
    } as unknown as BaseCryptoStatsSDK;

    const list = new List('test', sdk);

    await list.fetchAdapters();

    expect(list.adapters.length).to.equal(1);
    expect(list.adapters[0].id).to.equal('polymarket');
    expect(list.adapters[0].bundle).to.equal('my-bundle');
  });

  it('should store bundles', async function() {
    const list = new List('test');

    list.addBundle('uniswap', { name: 'Uniswap' });

    expect(list.bundleIds).to.deep.equal(['uniswap']);
    expect(await list.getBundle('uniswap')).to.deep.equal({ name: 'Uniswap' });
    expect(await list.getBundles()).to.deep.equal([{ name: 'Uniswap' }]);
  });

  it('should skip fetching a second time', async function() {
    let fetchedOnce = false;
    const sdk = {
      http: {
        async get(url: string) {
          if (fetchedOnce) {
            throw new Error("Shouldn't fetch a second time");
          }
          expect(url).to.equal('https://cryptostats.community/api/list/test');
          return { success: true, result: ['myCID'] };
        }
      },
      ipfs: {
        getFile(cid: string) {
          expect(cid).to.equal('myCID');
          return POLYGON_MODULE_CODE;
        },
      },
      getContext(_list: List) {
        return {
          register(registration: any) {
            _list.addAdapter(registration);
          }
        };
      },
    } as unknown as BaseCryptoStatsSDK;

    const list = new List('test', sdk);

    await list.fetchAdapters();
    fetchedOnce = true;
    await list.fetchAdapters();

    expect(list.adapters.length).to.equal(1);
    expect(list.adapters[0].id).to.equal('polymarket');
  });

  it('should fetch a single module from IPFS', async function() {
    const sdk = {
      ipfs: {
        getFile(cid: string) {
          expect(cid).to.equal('myCID');
          return POLYGON_MODULE_CODE;
        },
      },
      getContext(_list: List) {
        return {
          register(registration: any) {
            _list.addAdapter(registration);
          }
        };
      },
    } as unknown as BaseCryptoStatsSDK;

    const list = new List('test', sdk);

    await list.fetchAdapterFromIPFS('myCID');

    expect(list.adapters.length).to.equal(1);
    expect(list.adapters[0].id).to.equal('polymarket');
  });

  it('should optionally allow silently allowing missing queries', async function() {
    const list = new List('test');
    list.addAdapter({ id: 'test1', queries: { test: () => 1}, metadata: {} });
    list.addAdapter({ id: 'test2', queries: {}, metadata: {} });

    const result = await list.executeQuery('test', { allowMissingQuery: true });
    expect(result).to.deep.equal([
      { id: 'test1', result: 1, bundle: null },
      { id: 'test2', result: null, bundle: null },
    ]);
  });
});
