import { expect } from 'chai';
import { MongoClient } from '../mocks/MongoMock';
import { MongoCache } from '../../src/caches/MongoCache';

describe('MongoCache', function() {
  let mongoCache = new MongoCache('', { client: MongoClient });

  beforeEach(() => {
    mongoCache = new MongoCache('', { client: MongoClient });
  });

  it('should read & write values', async () => {
    let value = await mongoCache.getValue('bitcoin', 'price', '2021-01-01');
    expect(value).to.be.null;

    await mongoCache.setValue('bitcoin', 'price', '2021-01-01', 1000);

    value = await mongoCache.getValue('bitcoin', 'price', '2021-01-01');
    expect(value).to.equal(1000);
  });
});
