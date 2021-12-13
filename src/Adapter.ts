import { clean } from './utils/clean';
import { ICache } from './types';
import { Metadata } from './Metadata';

interface AdapterProps {
  metadata: any;
  cache?: ICache | null;
  bundle?: string | null;
}

type QueryFn<Output = any, Input = any> = (...params: Input[]) => Promise<Output>

export class Adapter {
  readonly id: string;
  private metadata: Metadata;
  readonly bundle: string | null;

  public queries: { [name: string]: (...params: any[]) => Promise<number> } = {};
  private cache: ICache | null;

  constructor(id: string, { metadata, cache, bundle }: AdapterProps) {
    this.id = id;
    this.metadata = new Metadata(metadata);
    this.cache = cache || null;
    this.bundle = bundle || null;
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

    try {
      const result = clean(await this.queries[type](...params));

      return result;
    } catch (e: any) {
      throw new Error(`Error executing ${type} on ${this.id}: ${e.message}`);
    }
  }

  getRawMetadata() {
    return this.metadata.getRawMetadata();
  }

  async getMetadata() {
    return await this.metadata.getMetadata();
  }
}
