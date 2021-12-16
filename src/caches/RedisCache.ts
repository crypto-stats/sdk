import redis from 'redis';
import { promisify } from 'util';

interface RedisCacheOptions {
  redisLibrary?: any;
}

export class RedisCache {
  private client: any;
  private get: any;
  private set: any;

  constructor(redisUrl: string, {
    redisLibrary = redis,
  }: RedisCacheOptions = {}) {
    this.client = redisLibrary.createClient({ url: redisUrl });
    this.get = promisify(this.client.get).bind(this.client);
    this.set = promisify(this.client.set).bind(this.client);
  }

  async getValue(name: string, type: string, key: string) {
    const value = await this.get(this.serialize(name, type, key));
    
    if (value && value !== 'NaN') {
      return parseFloat(value);
    }
    return null;
  }

  setValue(name: string, type: string, key: string, value: string | number) {
    return this.set(this.serialize(name, type, key), value);
  }

  serialize(name: string, type: string, key: string) {
    return `${name}-${type}-${key}`;
  }
}
