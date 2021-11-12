import { MemoryCache } from './caches/MemoryCache';
import { ChainData } from './libs/ChainData';
import { CoinGecko } from './libs/CoinGecko';
import { DateLib } from './libs/DateLib';
import { Ethers } from './libs/Ethers';
import { IPFS } from './libs/IPFS';
import { Graph } from './libs/Graph';
import { HTTP } from './libs/HTTP';
import { Log, LOG_LEVEL } from './libs/Log';
import { Plugins } from './libs/Plugins';
import { Context } from './Context';
import { List } from './List';
import { ICache } from './types';

export interface CryptoStatsOptions {
  ipfsGateway?: string;
  cache?: ICache;
  infuraKey?: string;
  moralisKey?: string;
  mongoConnectionString?: string;
  redisConnectionString?: string;
  executionTimeout?: number;
  onLog?: (level: LOG_LEVEL, ...args: any[]) => void;
}

export abstract class BaseCryptoStatsSDK {
  public cache: ICache;
  
  readonly coinGecko: CoinGecko;
  readonly chainData: ChainData;
  readonly date: DateLib;
  readonly ethers: Ethers;
  readonly graph: Graph;
  readonly http: HTTP;
  readonly ipfs: IPFS;
  readonly log: Log;
  readonly plugins: Plugins;

  readonly executionTimeout: number;

  private lists: { [name: string]: List } = {};

  constructor({
    ipfsGateway,
    cache,
    infuraKey,
    moralisKey,
    mongoConnectionString,
    redisConnectionString,
    executionTimeout = 30,
    onLog,
  }: CryptoStatsOptions = {}) {
    this.executionTimeout = executionTimeout;

    // Ensure the cache is set. This should be overwritten, but the compiler likes it :)
    this.cache = new MemoryCache();

    if (cache) {
      this.cache = cache;
    } else {
      this.setupCache({ mongoConnectionString, redisConnectionString });
    }

    this.plugins = new Plugins();
    this.date = new DateLib();
    this.http = new HTTP();
    this.ipfs = new IPFS({ gateway: ipfsGateway });
    this.log = new Log({ onLog });
    this.graph = new Graph({ http: this.http });
    this.chainData = new ChainData({
      graph: this.graph,
      cache: this.cache,
      date: this.date,
      log: this.log,
    });
    this.ethers = new Ethers({ chainData: this.chainData });
    this.coinGecko = new CoinGecko({ http: this.http, cache: this.cache, log: this.log });

    if (moralisKey) {
      const networks = ['mainnet', 'kovan', 'ropsten', 'goerli', 'rinkeby'];
      for (const network of networks) {
        const url = `https://speedy-nodes-nyc.moralis.io/${moralisKey}/eth/${network}/archive`;
        this.ethers.addProvider(network === 'mainnet' ? 'ethereum' : network, url, { archive: true });
      }
      this.ethers.addProvider('arbitrum', `https://speedy-nodes-nyc.moralis.io/${moralisKey}/arbitrum/mainnet`);
      this.ethers.addProvider('polygon', `https://speedy-nodes-nyc.moralis.io/${moralisKey}/polygon/mainnet/archive`, { archive: true });
      this.ethers.addProvider('bsc', `https://speedy-nodes-nyc.moralis.io/${moralisKey}/bsc/mainnet/archive`, { archive: true });
    } else if (infuraKey) {
      const networks = ['mainnet', 'kovan', 'ropsten', 'goerli', 'rinkeby'];
      for (const network of networks) {
        const url = `https://${network}.infura.io/v3/${infuraKey}`;
        this.ethers.addProvider(network === 'mainnet' ? 'ethereum' : network, url);
      }
    }
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
      ethers: this.ethers,
      log: this.log,
      plugins: this.plugins,
      list,
    });
    return context;
  }
}
