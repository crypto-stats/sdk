import { Adapter } from './Adapter';
import { BaseCryptoStatsSDK } from './BaseCryptoStatsSDK';
import { SetupFn } from './types';
import { Module } from './Module';

export class List {
  readonly name: string;
  readonly adapters: Adapter[] = [];
  private adaptersById: { [id: string]: Adapter } = {};
  private sdk?: BaseCryptoStatsSDK;

  constructor(name: string, sdk?: BaseCryptoStatsSDK) {
    this.name = name;
    this.sdk = sdk;
  }

  addAdapter({ id, queries, metadata }: { id: string; queries: any; metadata: any }) {
    if (this.adaptersById[id]) {
      throw new Error(`Adapter '${id}' already added`);
    }

    const adapter = new Adapter(id, {
      metadata,
      cache: this.sdk?.cache,
    });

    for (let name in queries) {
      adapter.addQuery(name, queries[name]);
    }

    this.adapters.push(adapter);
    this.adaptersById[id] = adapter;

    return adapter;
  }

  getAdapters() {
    return this.adapters;
  }

  getAdapter(id: string) {
    return this.adaptersById[id] || null;
  }

  getIDs() {
    return Object.keys(this.adaptersById);
  }

  async executeQuery(type: string, ...params: any[]) {
    return Promise.all(this.adapters.map(async (adapter: Adapter) => ({
      id: adapter.id,
      result: await adapter.query(type, ...params),
    })));
  }

  async executeQueryWithMetadata(type: string, ...params: any[]) {
    return Promise.all(this.adapters.map(async (adapter: Adapter) => {
      const [result, metadata] = await Promise.all([
        adapter.query(type, ...params),
        adapter.getMetadata(),
      ]);
      return { id: adapter.id, result, metadata };
    }))
  }

  async executeQueriesWithMetadata(types: string[], ...params: any[]) {
    return Promise.all(this.adapters.map(async (adapter: Adapter) => {
      const [metadata, ...resultsList] = await Promise.all([
        adapter.getMetadata(),
        ...types.map(type => adapter.query(type, ...params)),
      ]);

      const results: { [type: string]: any } = {};
      types.forEach((type: string, index: number) => {
        results[type] = resultsList[index];
      });

      return { id: adapter.id, results, metadata };
    }))
  }

  async fetchAdapters() {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }
    const response = await this.sdk.http.get(`https://cryptostats.community/api/list/${this.name}`);

    const adapters: string[] = await Promise.all(
      response.result.map((cid: string) => this.sdk!.ipfs.getFile(cid)));

    const modules = adapters.map(adapter => this.addAdaptersWithCode(adapter));
    return modules;
  }

  addAdaptersWithCode(code: string) {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }
    const context = this.sdk.getContext(this);
    const newModule = new Module({ code, context, executionTimeout: this.sdk.executionTimeout });
    newModule.evaluate();
    newModule.setup();
    return newModule;
  }

  addAdaptersWithSetupFunction(setupFn: SetupFn) {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }
    const context = this.sdk.getContext(this);
    const newModule = new Module({ setupFn, context, executionTimeout: this.sdk.executionTimeout });
    newModule.setup();
    return newModule;
  }
}
