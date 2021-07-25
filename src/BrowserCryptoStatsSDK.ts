import { MemoryCache } from './caches/MemoryCache';
import { BaseCryptoStatsSDK } from './BaseCryptoStatsSDK';

export class BrowserCryptoStatsSDK extends BaseCryptoStatsSDK {
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
