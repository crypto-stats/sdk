import ipfsClient from 'ipfs-http-client';
import CID from 'cids';
import type { RootAPI as IPFSClient } from 'ipfs-core-types';
import uint8ArrayConcat from 'uint8arrays/concat';
import all from 'it-all';

interface IPFSOptions {
  gateway?: string;
}

interface IPFSLoader {
  (): Promise<string>;
  cid: string;
  mimeType: string;
}

export class IPFS {
  private client: IPFSClient;

  constructor({
    gateway = 'https://ipfs.cryptostats.community',
  }: IPFSOptions = {}) {
    this.client = ipfsClient({ url: gateway }) as IPFSClient;
  }

  async getFile(cid: string | CID) {
    for await (const file of this.client.get(cid)) {
      if (file.type !== 'file') {
        throw new Error(`CID ${cid.toString()} is a ${file.type}, expected file`);
      }

      if (!(file as any).content) continue;

      let content = '';

      for await (const chunk of (file as any).content) {
        content += chunk.toString('utf8');
      }

      return content;
    }
    throw new Error(`No files found for CID ${cid.toString()}`);
  }

  async getDataURI(cid: string | CID, mimeType: string) {
    const data = uint8ArrayConcat(await all(this.client.cat(cid)));
    const base64 = Buffer.from(data).toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  getDataURILoader(cid: string | CID, mimeType: string): IPFSLoader {
    const fn = () => this.getDataURI(cid, mimeType);

    return Object.assign(fn, { cid: cid.toString(), mimeType });
  }
}
