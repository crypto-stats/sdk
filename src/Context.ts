import { ChainData } from './libs/ChainData';
import { CoinGecko } from './libs/CoinGecko';
import { DateLib } from './libs/DateLib';
import { Ethers } from './libs/Ethers';
import { IPFS } from './libs/IPFS';
import { Graph } from './libs/Graph';
import { HTTP } from './libs/HTTP';
import { List } from './List';

interface RegistrationData {
  id: string;
  queries: { [name: string]: (date: string) => Promise<number> };
  metadata: any;
}

interface ContextProps {
  coinGecko: CoinGecko;
  chainData: ChainData;
  date: DateLib;
  graph: Graph;
  http: HTTP;
  ipfs: IPFS;
  ethers: Ethers;
  list: List;
}

export class Context {
  readonly coinGecko: CoinGecko;
  readonly chainData: ChainData;
  readonly date: DateLib;
  readonly graph: Graph;
  readonly http: HTTP;
  readonly ipfs: IPFS;
  readonly ethers: Ethers;

  private list: List;

  constructor({
    coinGecko,
    chainData,
    date,
    graph,
    http,
    ipfs,
    ethers,
    list,
  }: ContextProps) {
    this.coinGecko = coinGecko;
    this.chainData = chainData;
    this.date = date;
    this.graph = graph;
    this.http = http;
    this.ipfs = ipfs;
    this.ethers = ethers;

    this.list = list;
  }

  register(registration: RegistrationData) {
    this.list.addAdapter(registration);
  }
}
