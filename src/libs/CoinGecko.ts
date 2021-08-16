import { ICache } from '../types';
import { HTTP } from './HTTP';

interface CoinGeckoProps {
  cache: ICache;
  http: HTTP;
}

export class CoinGecko {
  private cache: ICache;
  private http: HTTP;

  constructor({ cache, http }: CoinGeckoProps) {
    this.cache = cache;
    this.http = http;
  }

  async getCurrentPrice(name: string, currency = 'usd') {
    const response = await this.http.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${name}&vs_currencies=${currency}`
    );
    if (!response[name]) {
      throw new Error(`${name} is not a valid CoinGecko ID`);
    }
    return response[name][currency];
  }

  async getHistoricalPrice(name: string, date: string) {
    if (name == 'usd') {
      return 1;
    }

    const marketData = await this.getHistoricalMarketData(name, date);
    return marketData.price;
  }

  async getHistoricalMarketData(name: string, date: string) {
    let price = await this.cache.getValue(name, 'price', date);
    let marketCap = await this.cache.getValue(name, 'market-cap', date);

    if (!price || !marketCap) {
      const storedPrice = price;
      const storedMarketCap = marketCap;

      ({ price, marketCap } = await this.queryCoingecko(name, date));
      if (!storedPrice) {
        await this.cache.setValue(name, 'price', date, price);
      }

      if (!storedMarketCap) {
        await this.cache.setValue(name, 'market-cap', date, marketCap);
      }
    }

    return { price, marketCap };
  }

  async cacheMarketData(
    name: string,
    date: string,
    price: number,
    marketCap: number
  ) {
    // eslint-disable-next-line no-console
    console.log(`Optimisticly caching market data for ${name} on ${date}`);

    await Promise.all([
      this.cache.setValue(name, 'price', date, price),
      this.cache.setValue(name, 'market-cap', date, marketCap),
    ]);
  }

  async queryCoingecko(name: string, date: string, currency = 'usd') {
    // eslint-disable-next-line no-console
    console.log(`Querying CoinGecko for ${name} on ${date}`);

    const reversedDate = date.split('-').reverse().join('-');
    const response = await this.http.get(
      `https://api.coingecko.com/api/v3/coins/${name}/history?date=${reversedDate}`
    );

    if (!response.market_data) {
      throw new Error(`Can't get price data for ${name}`);
    }

    return {
      price: response.market_data.current_price[currency],
      marketCap: response.market_data.market_cap[currency],
    };
  }
}