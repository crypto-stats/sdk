import { expect } from 'chai';
import redis from '../mocks/redis-mock';
import { RedisCache } from '../../src/caches/RedisCache';

describe('RedisCache', function() {
  let redisCache = new RedisCache('', { redisLibrary: redis });

  beforeEach(() => {
    redisCache = new RedisCache('', { redisLibrary: redis });
  });

  it('should read & write values', async () => {
    let value = await redisCache.getValue('bitcoin', 'price', '2021-01-01');
    expect(value).to.be.null;

    await redisCache.setValue('bitcoin', 'price', '2021-01-01', 1000);

    value = await redisCache.getValue('bitcoin', 'price', '2021-01-01');
    expect(value).to.equal(1000);
  });
});
