import { HTTP } from "./HTTP";

interface DefiLlamaProps {
  http: HTTP;
}

interface PendingQuery {
  query: string;
  resolve: (value: number) => void;
  reject: (error: Error) => void;
}

export class DefiLlama {
  private pendingCurrentPriceQueries: PendingQuery[] = [];
  private http: HTTP;

  constructor({ http }: DefiLlamaProps) {
    this.http = http;
  }

  getCurrentPrice(context: string, asset: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (this.pendingCurrentPriceQueries.length === 0) {
        setTimeout(async () => {
          const pendingQueries = this.pendingCurrentPriceQueries;
          this.pendingCurrentPriceQueries = [];

          const queriesByQuery: { [query: string]: PendingQuery } = {};
          const queries = pendingQueries.map(query => {
            queriesByQuery[query.query] = query;
            return query.query;
          }).join(',');

          try {
            const results = await this.http.get(`https://coins.llama.fi/prices/current/${queries}`);

            for (const [query, result] of Object.entries<{ price: number }>(results.coins)) {
              if (queriesByQuery[query]) {
                queriesByQuery[query].resolve(result.price);
                delete queriesByQuery[query];
              }
            }
            for (const query of Object.values(queriesByQuery)) {
              query.reject(new Error('Price not found'));
            }
          } catch (e: any) {
            for (const query of pendingQueries) {
              query.reject(new Error(`DefiLlama query failed: ${e.message}`));
            }
          }
        }, 10);
      }

      const query = `${context}:${asset}`;
      this.pendingCurrentPriceQueries.push({ resolve, reject, query });
    });
  }
}
