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
    const query = `{
      ethburned(id:"1", block: { number: 13054993 }) {
        burned
      }
    }`;

    const result = await graph.query('dmihal/eth-burned', query, {
      node: 'http://subgraph.ethburned.com',
    });

    expect(result).to.deep.equal({
      ethburned: {
        burned: '63688.35641002801501576',
      },
    });
  });
});
