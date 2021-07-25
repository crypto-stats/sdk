import { MemoryCache } from './caches/MemoryCache';
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

export abstract class BaseCryptoStatsSDK {
  public cache: ICache;
  
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
    // Ensure the cache is set. This should be overwritten, but the compiler likes it :)
    this.cache = new MemoryCache();

    if (cache) {
      this.cache = cache;
    } else {
      this.setupCache({ mongoConnectionString, redisConnectionString });
    }

    this.date = new DateLib();
    this.http = new HTTP();
    this.ipfs = new IPFS({ gateway: ipfsGateway });
    this.graph = new Graph({ http: this.http });
    this.chainData = new ChainData({ graph: this.graph, cache: this.cache });
    this.coinGecko = new CoinGecko({ http: this.http, cache: this.cache });
  }

  protected abstract setupCache(params: { mongoConnectionString?: string; redisConnectionString?: string }): void;

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
