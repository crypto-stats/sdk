import { ICache } from '../types';

export class MultiCache implements ICache {
  public caches: ICache[];

  constructor(caches: ICache[]) {
    this.caches = caches;
  }

  async getValue(name: string, type: string, key: string) {
    for (let i = 0; i < this.caches.length; i += 1) {
      let value = await this.caches[i].getValue(name, type, key);
      if (value) {
        await Promise.all(this.caches.slice(0, i).map(cache => cache.setValue(name, type, key, value)));
        return value;
      }
    }
  }
  
  async setValue(name: string, type: string, key: string, value: string | number) {
    await Promise.all(this.caches.map((cache: ICache) => cache.setValue(name, type, key, value)));
  }
}
