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
      variables: { block: 500 },
      operationName: 'invariant',
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

    const result = await graph.query('pancakeswap/exchange-v2', query, {
      node: 'https://bsc.streamingfast.io',
    });

    expect(result).to.deep.equal({
      pancakeFactory: {
        totalTransactions: '397019344',
      },
    });
  });
});
