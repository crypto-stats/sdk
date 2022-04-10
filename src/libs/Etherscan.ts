import { HTTP } from "./HTTP";

const chains: { [name: string]: string } = {
  'ethereum': 'api.etherscan.io',
  'arbitrum': 'api.arbiscan.io',
  'arbitrum-one': 'api.arbiscan.io',
  'optimism': 'api-optimistic.etherscan.io',
  'polygon': 'api.polygonscan.com',
  'bsc': 'api.bscscan.com',
  'avalanche': 'api.snowtrace.io',
  'fantom': 'api.ftmscan.com',
}

export class Etherscan {
  private keys: { [network: string]: string };
  private http: HTTP;

  constructor(keys: { [network: string]: string }, http: HTTP) {
    this.keys = keys;
    this.http = http;
  }

  async query(params: any, chain = 'ethereum') {
    const urlParams = new URLSearchParams(params);
    urlParams.append('apikey', this.keys.ethereum);

    const domain = chains[chain];
    if (!domain) {
      throw new Error(`Unknown chain ${chain}`);
    }

    const result = await this.http.get(`https://${domain}/api?${urlParams}`)
    if (result.status !== '1') {
      throw new Error(`Error with Etherescan query: ${result.message || result.result}`);
    }

    return result.result;
  }
}