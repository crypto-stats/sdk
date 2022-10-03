
import {
  StargateClient,
  QueryClient,
  setupBankExtension,
  BankExtension
} from "@cosmjs/stargate";
import { Tendermint34Client, HttpClient } from "@cosmjs/tendermint-rpc";

export class Cosmos {
  private rpcByChain: { [network: string]: string } = {};

  addChain(name: string, url: string) {
    this.rpcByChain[name] = url;
  }

  private getRPC(chain: string): string {
    if (!this.rpcByChain[chain]) {
      throw new Error(`Tendermint chain ${chain} is unavailable`);
    }
    return this.rpcByChain[chain];
  }

  getStargateClient(chain: string): StargateClient {
    const rpc = this.getRPC(chain);

    // This constructor is private, but works normally. Using the private constructor allows us
    // to avoid the async factory function
    // @ts-ignore
    const tmClient = new Tendermint34Client(new HttpClient(rpc));

    // @ts-ignore
    const client = new StargateClient(tmClient, {});
    return client; 
  }

  getQueryClient(chain: string): QueryClient & BankExtension {
    const rpc = this.getRPC(chain);

    // This constructor is private, but works normally. Using the private constructor allows us
    // to avoid the async factory function
    // @ts-ignore
    const tmClient = new Tendermint34Client(new HttpClient(rpc));

    const client = QueryClient.withExtensions(tmClient, setupBankExtension);
    return client; 
  }
}
