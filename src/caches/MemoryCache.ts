import { ICache } from '../types';

export class MemoryCache implements ICache {
  private cacheStorage: { [key: string]: any } = {};

  async getValue(name: string, type: string, date: string) {
    return this.cacheStorage[this.serialize(name, type, date)] || null;
  }
  
  async setValue(name: string, type: string, date: string, value: string | number) {
    this.cacheStorage[this.serialize(name, type, date)] = value;
  }

  serialize(name: string, type: string, date: string) {
    return `${name}-${type}-${date}`;
  }
}
