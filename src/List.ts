import { Adapter } from './Adapter';

export class List {
  readonly name: string;
  readonly adapters: Adapter[] = [];
  private adaptersById: { [id: string]: Adapter } = {};

  constructor(name: string) {
    this.name = name;
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
}
