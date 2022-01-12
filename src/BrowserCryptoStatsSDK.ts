import { MemoryCache } from './caches/MemoryCache';
import { BaseCryptoStatsSDK, CryptoStatsOptions } from './BaseCryptoStatsSDK';
import * as browserVM from './utils/browser-vm';

export class BrowserCryptoStatsSDK extends BaseCryptoStatsSDK {
  constructor(options: CryptoStatsOptions) {
    super({
      vm: browserVM,
      ...options,
    });
  }

  setupCache({ mongoConnectionString, redisConnectionString }: {
    mongoConnectionString?: string;
    redisConnectionString?: string;
  }) {
    if (mongoConnectionString) {
      console.warn('Mongo caches are disabled on the browser');
    }
    if (redisConnectionString) {
      console.warn('Redis caches are disabled on the browser');
    }

    this.cache = new MemoryCache();
  }
}
