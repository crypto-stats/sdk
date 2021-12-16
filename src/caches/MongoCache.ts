import { MongoClient } from 'mongodb';

interface MongoCacheOptions {
  dbName?: string;
  collectionName?: string;
  client?: any;
}

export class MongoCache {
  private client: MongoClient;
  readonly dbName: string;
  readonly collectionName: string;

  constructor(connectionString: string, {
    dbName = 'cryptostats',
    collectionName = 'cache',
    client = MongoClient,
  }: MongoCacheOptions = {}) {
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.client = new client(connectionString);
    this.client.connect();
  }

  async getValue(name: string, type: string, key: string) {
    const query = await this.client
      .db(this.dbName)
      .collection(this.collectionName)
      .findOne({ name, type, key });


    if (query && !isNaN(query.value)) {
      const value = parseFloat(query.value);
      return value;
    }
    return null;
  }

  async setValue(name: string, type: string, key: string, value: string | number) {
    await this.client
      .db(this.dbName)
      .collection(this.collectionName)
      .insertOne({ name, type, key, value });
  }
}
