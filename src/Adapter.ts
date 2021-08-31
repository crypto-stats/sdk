import { ICache } from './types';

interface AdapterProps {
  metadata: any;
  cache?: ICache | null;
}

type QueryFn<Output = any, Input = any> = (...params: Input[]) => Promise<Output>

export class Adapter {
  readonly id: string;
  public metadata: any;

  public queries: { [name: string]: (...params: any[]) => Promise<number> } = {};
  private cache: ICache | null;

  constructor(id: string, { metadata, cache }: AdapterProps) {
    this.id = id;
    this.metadata = metadata;
    this.cache = cache || null;
  }

  addQuery(type: string, query: QueryFn) {
    this.queries[type] = query;
  }

  async query(type: string, ...input: any[]) {
    let _input = input;
    let allowMissingQuery = false;
    if (input.length > 0 && input[input.length - 1].allowMissingQuery) {
      _input = input.slice(0, -1);
      allowMissingQuery = true;
    }

    if (allowMissingQuery && !this.queries[type]) {
      return null;
    }

    const inputSerialized = _input.join('-');
    const cachedValue = await this.cache?.getValue(this.id, type, inputSerialized);
    if (cachedValue) {
      return cachedValue;
    } else {
      const result = await this.executeQuery(type, ..._input);
      await this.cache?.setValue(this.id, type, inputSerialized, result);
      return result;
    }
  }

  async executeQuery(type: string, ...params: any[]) {
    if (!this.queries[type]) {
      throw new Error(`Adapter ${this.id} does not support ${type} queries`);
    }

    const result = await this.queries[type](...params);

    return result;
  }

  async getMetadata() {
    const metadata = { ...this.metadata };

    await Promise.all(Object.entries(metadata).map(async ([key, val]: [string, any]) => {
      if (val?.then) {
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
