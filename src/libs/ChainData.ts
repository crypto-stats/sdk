import { Graph } from './Graph';
import { ICache } from '../types';

interface ChainDataProps {
  graph: Graph;
  cache: ICache;
}

export class ChainData {
  private graph: Graph;
  private cache: ICache;
  private blockNumLoaders: { [id: string]: (date: string) => Promise<number> } = {};
  private promiseCache: { [id: string]: Promise<number> } = {};

  constructor({ graph, cache }: ChainDataProps) {
    this.graph = graph;
    this.cache = cache;

    this.blockNumLoaders.ethereum = this.getBlockSubgraphQuery('blocklytics/ethereum-blocks');
    this.blockNumLoaders.polygon = this.getBlockSubgraphQuery('elkfinance/matic-blocks');
    this.blockNumLoaders.avalanche = this.getBlockSubgraphQuery('dasconnor/avalanche-blocks');
    this.blockNumLoaders.optimism = async (date: string) => {
      const time = Math.floor(new Date(date).getTime() / 1000);
      const res = await this.graph.query(
        'dmihal/optimism-fees',
        `query blocks($timestamp: String!) {
          block: dateToBlock(id: $timestamp) {
            blockNum
          }
        }`,
        {
          timestamp: time.toString(),
        }
      );

      if (!res.block) {
        throw new Error(`Could not find Optimism block on ${date}`);
      }

      return parseInt(res.block.blockNum);
    };
  }

  getBlockNumber(date: string, chain: string = 'ethereum') {
    const key = `${chain}-${date}`;
    if (!this.promiseCache[key]) {
      this.promiseCache[key] = this.getBlockNumberInternal(date, chain);
    }
    return this.promiseCache[key];
  }

  private async getBlockNumberInternal(date: string, chain: string) {
    const cachedValue = await this.cache.getValue(chain, 'block', date);
    if (cachedValue) {
      return cachedValue;
    }

    console.log(`Cache miss for block number for ${chain} on ${date}`);

    const loader = this.blockNumLoaders[chain];
    if (!loader) {
      throw new Error(`Can't get block number for ${chain}`);
    }

    const block = await loader(date);

    await this.cache.setValue(chain, 'block', date, block);

    return block;
  }

  getBlockSubgraphQuery(subgraph: string) {
    return (date: string) => this.blockSubgraphQuery(subgraph, date);
  }

  async blockSubgraphQuery(subgraph: string, date: string) {
    const time = Math.floor(new Date(date).getTime() / 1000);
    const res = await this.graph.query(
      subgraph,
      `query blocks($timestampFrom: Int!, $timestampTo: Int!) {
        blocks(
          first: 1
          orderBy: timestamp
          orderDirection: asc
          where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
        ) {
          number
        }
      }`,
      {
        timestampFrom: time,
        timestampTo: time + 60 * 60, // 1 hour window
      }
    );

    return parseInt(res.blocks[0].number);
  };
}
