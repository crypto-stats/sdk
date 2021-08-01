import { Graph } from './Graph';
import { DateLib } from './DateLib';
import { ICache } from '../types';

interface ChainDataProps {
  graph: Graph;
  cache: ICache;
  date: DateLib;
}

export class ChainData {
  private graph: Graph;
  private date: DateLib;
  private cache: ICache;
  private blockNumLoaders: { [id: string]: (date: string | Date | number) => Promise<number> } = {};
  private promiseCache: { [id: string]: Promise<number> } = {};

  constructor({ graph, date, cache }: ChainDataProps) {
    this.graph = graph;
    this.date = date;
    this.cache = cache;

    this.blockNumLoaders.ethereum = this.getBlockSubgraphQuery('blocklytics/ethereum-blocks');
    this.blockNumLoaders.kovan = this.getBlockSubgraphQuery('blocklytics/kovan-blocks');
    this.blockNumLoaders.goerli = this.getBlockSubgraphQuery('blocklytics/goerli-blocks');
    this.blockNumLoaders.rinkeby = this.getBlockSubgraphQuery('blocklytics/rinkeby-blocks');
    this.blockNumLoaders.xdai = this.getBlockSubgraphQuery('1hive/xdai-blocks');
    this.blockNumLoaders.fantom = this.getBlockSubgraphQuery('0xfin/fantomblocks');
    this.blockNumLoaders.bsc = this.getBlockSubgraphQuery('generatefinance/bsc-blocks');
    this.blockNumLoaders.polygon = this.getBlockSubgraphQuery('elkfinance/matic-blocks');
    this.blockNumLoaders.avalanche = this.getBlockSubgraphQuery('dasconnor/avalanche-blocks');
    this.blockNumLoaders.optimism = async (date: string | Date | number) => {
      const time = this.dateToTime(date);
      const res = await this.graph.query(
        'dmihal/optimism-fees',
        `query blocks($timestamp: String!) {
          block: dateToBlock(id: $timestamp) {
            blockNum
          }
        }`,
        {
          variables: {
            timestamp: time.toString(),
          },
        }
      );

      if (!res.block) {
        throw new Error(`Could not find Optimism block on ${date}`);
      }

      return parseInt(res.block.blockNum);
    };
  }

  getBlockNumber(date: string | number | Date, chain: string = 'ethereum') {
    const key = `${chain}-${date.toString()}`;
    if (!this.promiseCache[key]) {
      this.promiseCache[key] = this.getBlockNumberInternal(date, chain);
    }
    return this.promiseCache[key];
  }

  private async getBlockNumberInternal(date: string | number | Date, chain: string) {
    const loader = this.blockNumLoaders[chain];
    if (!loader) {
      throw new Error(`Can't get block number for ${chain}`);
    }

    // We'll cache normal dates, but it doesn't make sense to cache arbitrary times
    if (typeof date !== 'string') {
      const block = await loader(date);
      return block;
    }

    const cachedValue = await this.cache.getValue(chain, 'block', date);
    if (cachedValue) {
      return cachedValue;
    }

    console.log(`Cache miss for block number for ${chain} on ${date}`);

    const block = await loader(date);

    await this.cache.setValue(chain, 'block', date, block);

    return block;
  }

  getBlockSubgraphQuery(subgraph: string) {
    return (date: string | Date | number) => this.blockSubgraphQuery(subgraph, date);
  }

  async blockSubgraphQuery(subgraph: string, date: string | Date | number) {
    const time = this.dateToTime(date);

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
        variables: {
          timestampFrom: time,
          timestampTo: time + 60 * 60, // 1 hour window
        },
      },
    );

    return parseInt(res.blocks[0].number);
  };

  private dateToTime(date: string | Date | number): number {
    if (typeof date === 'string') {
      return this.date.dateToTimestamp(date);      
    } else if (typeof date === 'number') {
      const JAN_1_2000 = 946684800000;
      return date > JAN_1_2000 ? Math.floor(date / 1000) : date; // Convert ms to s
    } else {
      return Math.floor(date.getTime() / 1000);
    }
  }
}
