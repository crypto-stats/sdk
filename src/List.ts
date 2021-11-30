import { Adapter } from './Adapter';
import { BaseCryptoStatsSDK } from './BaseCryptoStatsSDK';
import { SetupFn } from './types';
import { Module } from './Module';
import { Metadata } from './Metadata';

interface AdapterData {
  id: string;
  queries: any;
  metadata: any;
  bundle?: string | null;
}

export class List {
  readonly name: string;
  readonly adapters: Adapter[] = [];
  readonly bundleIds: string[] = [];
  private adaptersById: { [id: string]: Adapter } = {};
  private bundlesById: { [id: string]: Metadata } = {};
  private sdk?: BaseCryptoStatsSDK;

  private adaptersFetched = false;

  constructor(name: string, sdk?: BaseCryptoStatsSDK) {
    this.name = name;
    this.sdk = sdk;
  }

  addAdapter({ id, queries, metadata, bundle }: AdapterData) {
    if (this.adaptersById[id]) {
      throw new Error(`Adapter '${id}' already added`);
    }

    const adapter = new Adapter(id, {
      metadata,
      cache: this.sdk?.cache,
      bundle,
    });

    for (let name in queries) {
      adapter.addQuery(name, queries[name]);
    }

    this.adapters.push(adapter);
    this.adaptersById[id] = adapter;

    return adapter;
  }

  addBundle(id: string, metadata: any = {}) {
    if (this.bundleIds.indexOf(id) !== -1) {
      throw new Error(`Bundle ${id} already exists`);
    }

    this.bundleIds.push(id);
    this.bundlesById[id] = new Metadata(metadata);
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

  async getBundle(id: string) {
    if (!this.bundlesById[id]) {
      throw new Error(`No bundle ${id}`);
    }
    const metadata = await this.bundlesById[id].getMetadata();
    return metadata;
  }

  getBundles() {
    return Promise.all(this.bundleIds.map((id: string) => this.bundlesById[id].getMetadata()));
  }

  async executeQuery(type: string, ...params: any[]) {
    return Promise.all(this.adapters.map(async (adapter: Adapter) => ({
      id: adapter.id,
      bundle: adapter.bundle,
      result: await adapter.query(type, ...params),
    })));
  }

  async executeQueryWithMetadata(type: string, ...params: any[]) {
    return Promise.all(this.adapters.map(async (adapter: Adapter) => {
      const [result, metadata] = await Promise.all([
        adapter.query(type, ...params),
        adapter.getMetadata(),
      ]);
      return {
        id: adapter.id,
        bundle: adapter.bundle,
        result,
        metadata,
      };
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

      return {
        id: adapter.id,
        results,
        metadata,
        bundle: adapter.bundle,
      };
    }))
  }

  async fetchAdapters() {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }
    if (this.adaptersFetched) {
      console.warn(`Adapters for ${this.name} already fetched, skipping`);
      return;
    }

    const query = `query adapters($list: String!){
      listAdapters(where: { list: $list }) {
        adapter {
          id
        }
      }
    }`;

    const data = await this.sdk.graph.query(this.sdk.adapterListSubgraph, query, {
      variables: { list: this.name },
    });

    const modules = await Promise.all(
      data.listAdapters.map((adapter: any) => this.fetchAdapterFromIPFS(adapter.adapter.id))
    );

    this.adaptersFetched = true;
    return modules;
  }

  async fetchAdapterFromIPFS(cid: string) {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }

    const code = await this.sdk.ipfs.getFile(cid);
    return this.addAdaptersWithCode(code);
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
