import { create, CID } from 'ipfs-http-client';
import type { IPFS as IPFSClient } from 'ipfs-core-types';

interface IPFSOptions {
  gateway?: string;
}

export class IPFS {
  private client: IPFSClient;

  constructor({
    gateway = 'https://ipfs.io',
  }: IPFSOptions = {}) {
    this.client = create({ url: gateway });
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
}
