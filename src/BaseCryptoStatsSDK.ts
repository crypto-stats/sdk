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
import { Collection } from './Collection';
import { ICache } from './types';
import { Etherscan } from './libs/Etherscan';
import { Cosmos } from './libs/Cosmos';

export interface CryptoStatsOptions {
  ipfsGateway?: string;
  cache?: ICache;
  infuraKey?: string;
  moralisKey?: string;
  etherscanKey?: string;
  mongoConnectionString?: string;
  redisConnectionString?: string;
  executionTimeout?: number;
  vm?: any;
  adapterListSubgraph?: string;
  onLog?: (level: LOG_LEVEL, ...args: any[]) => void;
}

export abstract class BaseCryptoStatsSDK {
  public cache: ICache;
  
  readonly coinGecko: CoinGecko;
  readonly cosmos: Cosmos;
  readonly chainData: ChainData;
  readonly date: DateLib;
  readonly ethers: Ethers;
  readonly graph: Graph;
  readonly http: HTTP;
  readonly ipfs: IPFS;
  readonly etherscan: Etherscan;
  readonly log: Log;
  readonly plugins: Plugins;
  readonly vm: any;

  readonly adapterListSubgraph: string;
  readonly executionTimeout: number;

  private collections: { [name: string]: Collection } = {};

  constructor({
    ipfsGateway,
    cache,
    infuraKey,
    moralisKey,
    etherscanKey,
    mongoConnectionString,
    redisConnectionString,
    executionTimeout = 30,
    adapterListSubgraph = 'dmihal/cryptostats-adapter-registry-test',
    vm,
    onLog,
  }: CryptoStatsOptions = {}) {
    this.executionTimeout = executionTimeout;
    this.adapterListSubgraph = adapterListSubgraph;

    this.vm = vm || null;

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
    this.cosmos = new Cosmos();
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
    this.etherscan = new Etherscan(etherscanKey ? { ethereum: etherscanKey } : {}, this.http);

    if (moralisKey) {
      const networks = ['mainnet', 'kovan', 'ropsten', 'goerli', 'rinkeby'];
      for (const network of networks) {
        const url = `https://speedy-nodes-nyc.moralis.io/${moralisKey}/eth/${network}/archive`;
        this.ethers.addProvider(network === 'mainnet' ? 'ethereum' : network, url, { archive: true });
      }
      this.ethers.addProvider('arbitrum-one', `https://speedy-nodes-nyc.moralis.io/${moralisKey}/arbitrum/mainnet`, { archive: true });
      this.ethers.addProvider('polygon', `https://speedy-nodes-nyc.moralis.io/${moralisKey}/polygon/mainnet/archive`, { archive: true });
      this.ethers.addProvider('bsc', `https://speedy-nodes-nyc.moralis.io/${moralisKey}/bsc/mainnet/archive`, { archive: true });
      this.ethers.addProvider('avalanche', `https://speedy-nodes-nyc.moralis.io/${moralisKey}/avalanche/mainnet`, { archive: true });
      this.ethers.addProvider('fantom', `https://speedy-nodes-nyc.moralis.io/${moralisKey}/fantom/mainnet`, { archive: true });
    } else if (infuraKey) {
      const networks = ['mainnet', 'kovan', 'ropsten', 'goerli', 'rinkeby'];
      for (const network of networks) {
        const url = `https://${network}.infura.io/v3/${infuraKey}`;
        this.ethers.addProvider(network === 'mainnet' ? 'ethereum' : network, url);
      }
    }
    this.ethers.addProvider('optimism', 'https://mainnet.optimism.io', { archive: true });
    this.ethers.addProvider('arbitrum-one', 'https://arb1.arbitrum.io/rpc');

    this.cosmos.addChain('cosmoshub', 'https://cosmos-mainnet-rpc.allthatnode.com:26657/');
    this.cosmos.addChain('osmosis', 'https://osmosis-mainnet-rpc.allthatnode.com:26657/');
    this.cosmos.addChain('juno', 'https://juno-rpc.polkachu.com/');
  }

  protected abstract setupCache(params: { mongoConnectionString?: string; redisConnectionString?: string }): void;

  getCollection(name: string) {
    if (!this.collections[name]) {
      this.collections[name] = new Collection(name, this);
    }
    return this.collections[name];
  }

  /**
   * @deprecated Use getCollection instead
   */
  getList(name: string) {
    return this.getCollection(name);
  }

  getContext(collection: Collection) {
    const context = new Context({
      coinGecko: this.coinGecko,
      cosmos: this.cosmos,
      chainData: this.chainData,
      date: this.date,
      graph: this.graph,
      http: this.http,
      ipfs: this.ipfs,
      ethers: this.ethers,
      etherscan: this.etherscan,
      log: this.log,
      plugins: this.plugins,
      collection,
    });
    return context;
  }
}
