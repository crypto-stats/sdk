import { ICache } from '../types';

export class MemoryCache implements ICache {
  private cacheStorage: { [key: string]: any } = {};

  async getValue(name: string, type: string, key: string) {
    return this.cacheStorage[this.serialize(name, type, key)] || null;
  }
  
  async setValue(name: string, type: string, key: string, value: string | number) {
    this.cacheStorage[this.serialize(name, type, key)] = value;
  }

  serialize(name: string, type: string, key: string) {
    return `${name}-${type}-${key}`;
  }
}
