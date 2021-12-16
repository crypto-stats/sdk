import { clean } from './utils/clean';
import { ICache } from './types';
import { Metadata } from './Metadata';

interface AdapterProps {
  metadata: any;
  cache?: ICache | null;
  bundle?: string | null;
}

export type QueryFn<Output = any, Input extends unknown[] = any[]> = (...params: Input) => Promise<Output>

export type CacheKeyResolver<Params extends unknown[] = any[]> = (id: string, query: string, ...params: Params) => string | null | undefined;

export class Adapter {
  readonly id: string;
  private metadata: Metadata;
  readonly bundle: string | null;

  public queries: { [name: string]: (...params: any[]) => Promise<number> } = {};
  private cache: ICache | null;

  private cacheKeyResolver: CacheKeyResolver | null = null;

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

    const cacheKey = this.cacheKeyResolver ? this.cacheKeyResolver(this.id, type, input) : null;
    const cachedValue = cacheKey && await this.cache?.getValue(this.id, type, cacheKey);

    if (cachedValue) {
      return cachedValue;
    } else {
      const result = await this.executeQuery(type, ..._input);

      if (cacheKey) {
        await this.cache?.setValue(this.id, type, cacheKey, result);
      }

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

  setCacheKeyResolver(newResolver: CacheKeyResolver) {
    this.cacheKeyResolver = newResolver;
  }
}
