class Collection {
  private documents: any[] = [];

  findOne(query: any) {
    for (const doc of this.documents) {
      for (const key in query) {
        if (!(key in doc) || doc[key] !== query[key]) {
          continue;
        }
        return doc;
      }
    }
    return null;
  }

  insertOne(doc: any) {
    this.documents.push(doc);
  }
}

class DB {
  private collections: { [name: string]: Collection } = {};

  collection(name: string) {
    if (!this.collections[name]) {
      this.collections[name] = new Collection();
    }
    return this.collections[name];
  }
}

export class MongoClient {
  private dbs: { [name: string]: DB } = {};

  constructor(_connectionString: string) {}

  connect() {}

  db(name: string) {
    if (!this.dbs[name]) {
      this.dbs[name] = new DB();
    }
    return this.dbs[name];
  }
}
