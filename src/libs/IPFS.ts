import 'isomorphic-fetch';

declare const fetch: any;

interface IPFSOptions {
  gateway?: string;
}

interface IPFSLoader {
  (): Promise<string>;
  cid: string;
  mimeType: string;
}

export class IPFS {
  private gateway: string;

  constructor({
    gateway = 'https://cryptostats.infura-ipfs.io',
  }: IPFSOptions = {}) {
    this.gateway = gateway;
  }

  async getFile(cid: string) {
    const res = await fetch(`${this.gateway}/ipfs/${cid}`);
    if (res.status !== 200) {
      throw new Error(`No files found for CID ${cid}`);
    }
    const text = await res.text();
    return text;
  }

  async getDataURI(cid: string, mimeType: string) {
    const res = await fetch(`${this.gateway}/ipfs/${cid}`);
    if (res.status !== 200) {
      throw new Error(`No files found for CID ${cid}`);
    }
    const data = await res.arrayBuffer();
    const base64 = Buffer.from(data).toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  getDataURILoader(cid: string, mimeType: string): IPFSLoader {
    const fn = () => this.getDataURI(cid, mimeType);

    return Object.assign(fn, { cid: cid.toString(), mimeType });
  }
}
