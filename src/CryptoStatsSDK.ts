import { MemoryCache } from './caches/MemoryCache';
import { MongoCache } from './caches/MongoCache';
import { RedisCache } from './caches/RedisCache';
import { MultiCache } from './caches/MultiCache';
import { ChainData } from './libs/ChainData';
import { CoinGecko } from './libs/CoinGecko';
import { DateLib } from './libs/DateLib';
import { IPFS } from './libs/IPFS';
import { Graph } from './libs/Graph';
import { HTTP } from './libs/HTTP';
import { Context } from './Context';
import { List } from './List';
import { ICache } from './types';

export interface CryptoStatsOptions {
  ipfsGateway?: string;
  cache?: ICache;
  mongoConnectionString?: string;
  redisConnectionString?: string;
}

export class CryptoStatsSDK {
  private cache: ICache;
  
  readonly coinGecko: CoinGecko;
  readonly chainData: ChainData;
  readonly date: DateLib;
  readonly graph: Graph;
  readonly http: HTTP;
  readonly ipfs: IPFS;

  private lists: { [name: string]: List } = {};

  constructor({
    ipfsGateway,
    cache,
    mongoConnectionString,
    redisConnectionString,
  }: CryptoStatsOptions = {}) {
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
    this.ipfs = new IPFS({ gateway: ipfsGateway });
    this.graph = new Graph({ http: this.http });
    this.chainData = new ChainData({ graph: this.graph, cache: this.cache });
    this.coinGecko = new CoinGecko({ http: this.http, cache: this.cache });
  }

  getList(name: string) {
    if (!this.lists[name]) {
      this.lists[name] = new List(name, this);
    }
    return this.lists[name];
  }

  getContext(list: List) {
    const context = new Context({
      coinGecko: this.coinGecko,
      chainData: this.chainData,
      date: this.date,
      graph: this.graph,
      http: this.http,
      ipfs: this.ipfs,
      list,
    });
    return context;
  }
}
