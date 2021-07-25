import { MemoryCache } from './caches/MemoryCache';
import { MongoCache } from './caches/MongoCache';
import { MultiCache } from './caches/MultiCache';
import { RedisCache } from './caches/RedisCache';
import { BaseCryptoStatsSDK } from './BaseCryptoStatsSDK';
import { ICache } from './types';

export class NodeCryptoStatsSDK extends BaseCryptoStatsSDK {
  setupCache({ mongoConnectionString, redisConnectionString }: {
    mongoConnectionString?: string;
    redisConnectionString?: string;
  }) {
    if (mongoConnectionString || redisConnectionString) {
      const caches: ICache[] = [new MemoryCache()];
      if (redisConnectionString) {
        caches.push(new RedisCache(redisConnectionString));
      }
      if (mongoConnectionString) {
        caches.push(new MongoCache(mongoConnectionString));
      }
      this.cache = new MultiCache(caches);
    } else {
      this.cache = new MemoryCache();
    }
  }
}
