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

    const result = await graph.query('dmihal/polygon-fees', query, { block: 500 }, 'invariant');

    expect(result).to.deep.equal({
      fee: {
        totalFees: '0.000042',
      }
    });
  });
});
