import { ChainData } from './libs/ChainData';
import { CoinGecko } from './libs/CoinGecko';
import { DateLib } from './libs/DateLib';
import { Ethers } from './libs/Ethers';
import { Etherscan } from './libs/Etherscan';
import { IPFS } from './libs/IPFS';
import { Graph } from './libs/Graph';
import { HTTP } from './libs/HTTP';
import { Log, LogInterface } from './libs/Log';
import { Plugins } from './libs/Plugins';
import { List } from './List';

interface RegistrationData {
  id: string;
  bundle?: string;
  queries: { [name: string]: (...args: any[]) => Promise<any> };
  metadata: any;
}

export interface ContextProps {
  coinGecko: CoinGecko;
  chainData: ChainData;
  date: DateLib;
  ethers: Ethers;
  graph: Graph;
  http: HTTP;
  ipfs: IPFS;
  etherscan: Etherscan;
  log: Log;
  plugins: Plugins;
  list: List;
}

export class Context {
  readonly coinGecko: CoinGecko;
  readonly chainData: ChainData;
  readonly date: DateLib;
  readonly ethers: Ethers;
  readonly graph: Graph;
  readonly http: HTTP;
  readonly ipfs: IPFS;
  readonly etherscan: Etherscan;
  readonly log: LogInterface;
  readonly plugins: Plugins;

  private list: List;

  constructor({
    coinGecko,
    chainData,
    date,
    graph,
    http,
    ipfs,
    ethers,
    etherscan,
    log,
    plugins,
    list,
  }: ContextProps) {
    this.coinGecko = coinGecko;
    this.chainData = chainData;
    this.date = date;
    this.graph = graph;
    this.http = http;
    this.ipfs = ipfs;
    this.ethers = ethers;
    this.etherscan = etherscan;
    this.log = log.getLogInterface();
    this.plugins = plugins;

    this.list = list;
  }

  register(registration: RegistrationData) {
    this.list.addAdapter(registration);
  }

  registerBundle(id: string, metadata?: any) {
    this.list.addBundle(id, metadata);
  }
}
