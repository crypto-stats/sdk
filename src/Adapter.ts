import { clean } from './utils/clean';
import { ICache } from './types';
import { Metadata } from './Metadata';
import { timeoutPromise } from './utils/timeout';

export type QueryFn<Output = any, Input extends unknown[] = any[]> = (...params: Input) => Promise<Output>

export type CacheKeyResolver<Params extends unknown[] = any[]> = (id: string, query: string, ...params: Params) => string | null | undefined;

interface AdapterProps {
  metadata: any;
  cache?: ICache | null;
  bundle?: string | null;
  cacheKeyResolver?: CacheKeyResolver | null;
}

export class Adapter {
  readonly id: string;
  private metadata: Metadata;
  readonly bundle: string | null;

  public queries: { [name: string]: (...params: any[]) => Promise<number> } = {};
  private cache: ICache | null;

  private cacheKeyResolver: CacheKeyResolver | null;

  constructor(id: string, { metadata, cache, bundle, cacheKeyResolver }: AdapterProps) {
    this.id = id;
    this.metadata = new Metadata(metadata);
    this.cache = cache || null;
    this.bundle = bundle || null;
    this.cacheKeyResolver = cacheKeyResolver || null;
  }

  addQuery(type: string, query: QueryFn) {
    this.queries[type] = query;
  }

  async query<Output = any>(type: string, ...input: any[]) {
    let _input = input;

    let allowMissingQuery = false;
    let refreshCache = false;
    let timeout = 60 * 1000; // One minute default timeout

    const lastElement = input.length > 0 ? input[input.length - 1] : null;
    if (lastElement?.allowMissingQuery || lastElement?.refreshCache) {
      if (lastElement.allowMissingQuery) {
        allowMissingQuery = true;
      }
      if (lastElement.refreshCache) {
        refreshCache = true;
      }
      if (lastElement.timeout) {
        timeout = lastElement.timeout;
      }

      _input = input.slice(0, -1);
    }

    if (allowMissingQuery && !this.queries[type]) {
      return null;
    }

    const cacheKey = this.cacheKeyResolver ? this.cacheKeyResolver(this.id, type, input) : null;
    const cachedValue = cacheKey && !refreshCache && await this.cache?.getValue(this.id, type, cacheKey);

    if (cachedValue) {
      return cachedValue as Output;
    } else {
      const result = await timeoutPromise(this.executeQuery(type, ..._input), timeout);

      if (cacheKey) {
        await this.cache?.setValue(this.id, type, cacheKey, result);
      }

      return result as Output;
    }
  }

  async executeQuery<Output = any>(type: string, ...params: any[]): Promise<Output> {
    if (!this.queries[type]) {
      throw new Error(`Adapter ${this.id} does not support ${type} queries`);
    }

    try {
      const result = clean(await this.queries[type](...params));

      return result as Output;
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
