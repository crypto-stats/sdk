import { MemoryCache } from './caches/MemoryCache';
import { ChainData } from './libs/ChainData';
import { CoinGecko } from './libs/CoinGecko';
import { DateLib } from './libs/DateLib';
import { Ethers } from './libs/Ethers';
import { IPFS } from './libs/IPFS';
import { Graph } from './libs/Graph';
import { HTTP } from './libs/HTTP';
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

  private lists: { [name: string]: List } = {};

  constructor({
    ipfsGateway,
    cache,
    infuraKey,
    moralisKey,
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
    this.chainData = new ChainData({ graph: this.graph, cache: this.cache, date: this.date });
    this.ethers = new Ethers({ chainData: this.chainData });
    this.coinGecko = new CoinGecko({ http: this.http, cache: this.cache });

    if (moralisKey) {
      const networks = ['mainnet', 'kovan', 'ropsten', 'goerli', 'rinkeby'];
      for (const network of networks) {
        const url = `https://speedy-nodes-nyc.moralis.io/${moralisKey}/eth/${network}/archive`;
        this.ethers.addProvider(url, network === 'mainnet' ? 'ethereum' : network, { archive: true });
      }
      this.ethers.addProvider(`https://speedy-nodes-nyc.moralis.io/${moralisKey}/arbitrum/mainnet`, 'arbitrum');
      this.ethers.addProvider(`https://speedy-nodes-nyc.moralis.io/${moralisKey}/polygon/mainnet/archive`, 'polygon', { archive: true });
      this.ethers.addProvider(`https://speedy-nodes-nyc.moralis.io/${moralisKey}/bsc/mainnet/archive`, 'bsc', { archive: true });
    } else if (infuraKey) {
      const networks = ['mainnet', 'kovan', 'ropsten', 'goerli', 'rinkeby'];
      for (const network of networks) {
        const url = `https://${network}.infura.io/v3/${infuraKey}`;
        this.ethers.addProvider(url, network === 'mainnet' ? 'ethereum' : network);
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
      list,
    });
    return context;
  }
}
