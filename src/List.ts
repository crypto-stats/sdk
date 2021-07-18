import { Adapter } from './Adapter';
import { CryptoStatsSDK } from './CryptoStatsSDK';
import { SetupFn } from './types';
import { Module } from './Module';

export class List {
  readonly name: string;
  readonly adapters: Adapter[] = [];
  private adaptersById: { [id: string]: Adapter } = {};
  private sdk?: CryptoStatsSDK;

  constructor(name: string, sdk?: CryptoStatsSDK) {
    this.name = name;
    this.sdk = sdk;
  }

  addAdapter({ id, queries, metadata }: { id: string; queries: any; metadata: any }) {
    const adapter = new Adapter(id, metadata);
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

  async executeQuery(type: string, date: string) {
    return Promise.all(this.adapters.map((adapter: Adapter) => adapter.executeQuery(type, date)));
  }

  addAdaptersWithCode(code: string) {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }
    const context = this.sdk.getContext(this);
    const newModule = new Module({ code, context });
    newModule.evaluate();
    newModule.setup();
  }

  addAdaptersWithSetupFunction(setupFn: SetupFn) {
    if (!this.sdk) {
      throw new Error('SDK not set');
    }
    const context = this.sdk.getContext(this);
    const newModule = new Module({ setupFn, context });
    newModule.setup();
  }
}
