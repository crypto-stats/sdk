import { ICache } from './types';

interface AdapterProps {
  metadata: any;
  cache?: ICache | null;
}

export class Adapter {
  readonly id: string;
  public metadata: any;

  public queries: { [name: string]: (date: string) => Promise<number> } = {};
  private cache: ICache | null;

  constructor(id: string, { metadata, cache }: AdapterProps) {
    this.id = id;
    this.metadata = metadata;
    this.cache = cache || null;
  }

  addQuery(type: string, query: (date: string) => Promise<number>) {
    this.queries[type] = query;
  }

  async query(type: string, date: string) {
    const cachedValue = await this.cache?.getValue(this.id, type, date);
    if (cachedValue) {
      return cachedValue;
    } else {
      const result = await this.executeQuery(type, date);
      await this.cache?.setValue(this.id, type, date, result);
      return result;
    }
  }

  async executeQuery(type: string, date: string) {
    if (!this.queries[type]) {
      throw new Error(`Adapter ${this.id} does not support ${type} queries`);
    }

    const result = await this.queries[type](date);

    return result;
  }

  async getMetadata() {
    const metadata = { ...this.metadata };

    await Promise.all(Object.entries(metadata).map(async ([key, val]: [string, any]) => {
      if (val.then) {
        metadata[key] = await val;
      } else if (typeof(val) === 'function') {
        const promiseOrResult = val();
        this.metadata[key] = promiseOrResult;
        metadata[key] = await promiseOrResult;
      }
    }));

    return metadata;
  }
}
