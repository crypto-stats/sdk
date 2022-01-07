import { HTTP } from "./HTTP";

export class Etherscan {
  private keys: { [network: string]: string };
  private http: HTTP;

  constructor(keys: { [network: string]: string }, http: HTTP) {
    this.keys = keys;
    this.http = http;
  }

  async query(params: any) {
    const urlParams = new URLSearchParams(params);
    urlParams.append('apikey', this.keys.ethereum);

    const result = await this.http.get(`https://api.etherscan.io/api?${urlParams}`)
    if (result.status !== '1') {
      throw new Error(`Error with Etherescan query: ${result.result}`);
    }

    return result.result;
  }
}