import { ICache } from '../types';

export class MultiCache implements ICache {
  public caches: ICache[];

  constructor(caches: ICache[]) {
    this.caches = caches;
  }

  async getValue(name: string, type: string, date: string) {
    for (let i = 0; i < this.caches.length; i += 1) {
      let value = await this.caches[i].getValue(name, type, date);
      if (value) {
        await Promise.all(this.caches.slice(0, i).map(cache => cache.setValue(name, type, date, value)));
        return value;
      }
    }
  }
  
  async setValue(name: string, type: string, date: string, value: string | number) {
    await Promise.all(this.caches.map((cache: ICache) => cache.setValue(name, type, date, value)));
  }
}
