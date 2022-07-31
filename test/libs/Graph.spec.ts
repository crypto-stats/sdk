import { expect } from 'chai';
import { Graph } from '../../src/libs/Graph';
import { HTTP } from '../../src/libs/HTTP';

describe('Graph', function() {
  let graph = new Graph({ http: new HTTP() });

  beforeEach(() => {
    graph = new Graph({ http: new HTTP() });
  });

  it('should query data from a subgraph', async () => {
    const query = `query invariant($block: Int!) {
      fee(id: "1", block:{ number: $block }) {
        totalFees
      }
    }`;

    const result = await graph.query('dmihal/polygon-fees', query, {
      block: 5499000,
    });

    expect(result).to.deep.equal({
      fee: {
        totalFees: '0.144133145',
      }
    });
  });

  it('should query data from a subgraph by ID', async () => {
    const query = `query invariant($block: Int!) {
      fee(id: "1", block:{ number: $block }) {
        totalFees
      }
    }`;

    const result = await graph.query({
      subgraphId: 'QmaNRUXW9g2Bo6wmcjJ2vtaae9v33sM6q4aWEfjJbc2kwU',
      query,
      variables: { block: 500 }
    });

    expect(result).to.deep.equal({
      fee: {
        totalFees: '0.000042',
      }
    });
  });

  it('should query a different graph node', async () => {
    const query = `query overview {
      pancakeFactory(id: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73", block: { number: 13000000 }) {
        totalTransactions
      }
    }`;

    const result = await graph.query({
      subgraph: 'pancakeswap/exchange-v2',
      query,
      node: 'https://bsc.streamingfast.io',
    });

    expect(result).to.deep.equal({
      pancakeFactory: {
        totalTransactions: '397019344',
      },
    });
  });

  it('should query data from a the decentralized Graph network', async () => {
    const query = `query collected {
      ens(id: "ens", block: { number: 14000000 }) {
        ethCollected
      }
    }`;

    const result = await graph.query({
      subgraphId: '9ZA2QGwURbZ8S3PfdKs4UyKKTvyoHfG4SsLkGBaiVi1Y',
      query,
      // Variables are not supported yet, will be fixed in the future
      // variables: { block: 14000000 },
    });

    expect(result).to.deep.equal({
      ens: {
        ethCollected: '10732.085247563696871674',
      }
    });
  });

  it('should query data from normal GraphQL endpoints', async () => {
    const query = `query {
      pool(address: "wrmcMSHFi3sWpAEy4rGDvQb3ezh3PhXoV2xNjgLBkKU") {
        name
      }
    }`;

    const result = await graph.query('https://saberqltest.aleph.cloud/?', query);

    expect(result).to.deep.equal({
      pool: {
        name: 'ETH-whETH',
      },
    });
  });
});
