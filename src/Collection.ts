import { Adapter, CacheKeyResolver } from './Adapter';
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

export interface SingleResult {
  id: string;
  bundle: string | null;
  result?: any;
  error?: any;
}

export interface ResultWithMetadata extends SingleResult {
  metadata: { [key: string]: any };
}

export interface ResultsWithMetadata {
  id: string;
  bundle: string | null;
  results: { [query: string]: any };
  errors: { [query: string]: any };
  metadata: { [key: string]: any };
}

export class Collection {
  readonly name: string;
  readonly adapters: Adapter[] = [];
  readonly bundleIds: string[] = [];
  private adaptersById: { [id: string]: Adapter } = {};
  private bundlesById: { [id: string]: Metadata } = {};
  private sdk?: BaseCryptoStatsSDK;
  private modules: Module[] = [];

  private adaptersFetched = false;
  private cacheKeyResolver: CacheKeyResolver | null = null;

  constructor(name: string, sdk?: BaseCryptoStatsSDK) {
    this.name = name;
    this.sdk = sdk;
  }

  addAdapter(adapterData: AdapterData | Adapter): Adapter {
    if (this.adaptersById[adapterData.id]) {
      throw new Error(`Adapter '${adapterData.id}' already added`);
    }

    let adapter: Adapter;
    if (adapterData instanceof Adapter) {
      adapter = adapterData as Adapter;
    } else {
      adapter = new Adapter(adapterData.id, {
        metadata: adapterData.metadata,
        cache: this.sdk?.cache,
        bundle: adapterData.bundle,
        cacheKeyResolver: this.cacheKeyResolver,
      });
      for (let name in adapterData.queries) {
        adapter.addQuery(name, adapterData.queries[name]);
      }
    }

    this.adapters.push(adapter);
    this.adaptersById[adapter.id] = adapter;

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

  getAdapter(id: string): Adapter | null {
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
    return Promise.all(this.bundleIds.map(async (id: string) => ({
      id,
      metadata: await this.bundlesById[id].getMetadata(),
    })));
  }

  async executeQuery(type: string, ...params: any[]): Promise<SingleResult[]> {
    return Promise.all(this.adapters.map(async (adapter: Adapter) => {
      const result = await adapter.query(type, ...params)
        .catch(error => ({ error }));

      const response: any = {
        id: adapter.id,
        bundle: adapter.bundle,
      };

      if (result?.error) {
        response.error = result.error.message || result.error;
        response.result = null;
      } else {
        response.result = result;
      }

      return response;
    }));
  }

  async executeQueryWithMetadata(type: string, ...params: any[]): Promise<ResultWithMetadata[]> {
    return Promise.all(this.adapters.map(async (adapter: Adapter) => {
      const [result, metadata] = await Promise.all([
        adapter.query(type, ...params)
          .catch(error => ({ error })),
        adapter.getMetadata(),
      ]);
      const response = {
        id: adapter.id,
        bundle: adapter.bundle,
        metadata,
      };

      return result?.error
        ? { ...response, error: result.error.message || result.error }
        : { ...response, result };
    }))
  }

  async executeQueriesWithMetadata(types: string[], ...params: any[]): Promise<ResultsWithMetadata[]> {
    return Promise.all(this.adapters.map(async (adapter: Adapter) => {
      const [metadata, ...resultsList] = await Promise.all([
        adapter.getMetadata(),
        ...types.map(type => adapter.query(type, ...params)
          .catch((error: any) => ({ error }))
        ),
      ]);

      const results: { [type: string]: any } = {};
      const errors: { [type: string]: any } = {};
      
      types.forEach((type: string, index: number) => {
        const result = resultsList[index]
        if (result?.error) {
          errors[type] = result.error.message || result.error;
        } else {
          results[type] = result;
        }
      });

      return {
        id: adapter.id,
        results,
        errors,
        metadata,
        bundle: adapter.bundle,
      };
    }))
  }

  async fetchAdapters(): Promise<Module[]> {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }
    if (this.adaptersFetched) {
      console.warn(`Adapters for ${this.name} already fetched, skipping`);
      return [];
    }

    const query = `query adapters($collection: String!){
      collectionAdapters(where: { collection: $collection }) {
        adapter {
          id
          code
        }
      }
    }`;

    const data = await this.sdk.graph.query(this.sdk.adapterListSubgraph, query, {
      variables: { collection: this.name },
    });

    const modules: Module[] = await Promise.all(
      data.collectionAdapters.map((collectionAdapter: any) => collectionAdapter.adapter.code
        ? this.addAdaptersWithCode(collectionAdapter.adapter.code)
        : this.fetchAdapterFromIPFS(collectionAdapter.adapter.id)
      )
    );

    this.modules = this.modules.concat(modules);

    this.adaptersFetched = true;
    return modules;
  }

  async fetchAdapterFromIPFS(cid: string): Promise<Module> {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }

    const code = await this.sdk.ipfs.getFile(cid);
    return this.addAdaptersWithCode(code);
  }

  addAdaptersWithCode(code: string): Module {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }
    const context = this.sdk.getContext(this);
    const newModule = new Module({
      code,
      context,
      executionTimeout: this.sdk.executionTimeout,
      vm: this.sdk.vm,
    });
    try {
      newModule.evaluate();
    } catch (e: any) {
      throw new Error(`Error evaluating module [${code.substring(0, 20)}]: ${e.message}`)
    }

    newModule.setup();
    this.modules.push(newModule);
    return newModule;
  }

  addAdaptersWithSetupFunction(setupFn: SetupFn) {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }
    const context = this.sdk.getContext(this);
    const newModule = new Module({
      setupFn,
      context,
      executionTimeout: this.sdk.executionTimeout,
      vm: this.sdk.vm,
    });
    newModule.setup();
    this.modules.push(newModule);
    return newModule;
  }

  setCacheKeyResolver(resolver: CacheKeyResolver) {
    this.cacheKeyResolver = resolver;
    for (const adapter of this.adapters) {
      adapter.setCacheKeyResolver(resolver);
    }
  }

  cleanupModules() {
    for (const module of this.modules) {
      module.cleanup();
    }
  }
}

export const List = Collection;
