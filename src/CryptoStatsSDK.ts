import { create, CID } from 'ipfs-http-client';
import type { IPFS } from 'ipfs-core-types';
import { MemoryCache } from './caches/MemoryCache';
import { MongoCache } from './caches/MongoCache';
import { RedisCache } from './caches/RedisCache';
import { MultiCache } from './caches/MultiCache';
import { ChainData } from './libs/ChainData';
import { CoinGecko } from './libs/CoinGecko';
import { DateLib } from './libs/DateLib';
import { Graph } from './libs/Graph';
import { HTTP } from './libs/HTTP';
import { ICache } from './types';

export interface CryptoStatsOptions {
  ipfsGateway?: string;
  cache?: ICache;
  mongoConnectionString?: string;
  redisConnectionString?: string;
}

export class CryptoStatsSDK {
  private ipfsClient: IPFS;
  private cache: ICache;
  
  readonly coinGecko: CoinGecko;
  readonly chainData: ChainData;
  readonly date: DateLib;
  readonly graph: Graph;
  readonly http: HTTP;

  constructor({
    ipfsGateway = 'https://ipfs.io',
    cache,
    mongoConnectionString,
    redisConnectionString,
  }: CryptoStatsOptions = {}) {
    this.ipfsClient = create({ url: ipfsGateway });

    if (cache) {
      this.cache = cache;
    } else if (mongoConnectionString || redisConnectionString) {
      const caches: ICache[] = [new MemoryCache()];
      if (redisConnectionString) {
        caches.push(new RedisCache(redisConnectionString));
      }
      if (mongoConnectionString) {
        caches.push(new MongoCache(mongoConnectionString));
      }
      this.cache = new MultiCache(caches);
    } else {
      this.cache = new MemoryCache();
    }

    this.date = new DateLib();
    this.http = new HTTP();
    this.graph = new Graph({ http: this.http });
    this.chainData = new ChainData({ graph: this.graph, cache: this.cache });
    this.coinGecko = new CoinGecko({ http: this.http, cache: this.cache });
  }

  async getAdapter(cid: CID | string) {
    for await (const file of this.ipfsClient.get(cid)) {
      if (file.type !== 'file') {
        throw new Error(`CID ${cid.toString()} is a ${file.type}, expected file`)
      }

      if (!(file as any).content) continue;

      let content = ''

      for await (const chunk of (file as any).content) {
        content += chunk.toString('utf8')
      }

      return content;
    }
    throw new Error(`No files found for CID ${cid.toString()}`)
  }
}
