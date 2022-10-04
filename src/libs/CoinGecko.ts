import { ICache } from '../types';
import { HTTP } from './HTTP';
import type { Log, LogInterface } from './Log';

interface CoinGeckoProps {
  cache: ICache;
  http: HTTP;
  log: Log;
  cacheExpiration?: number;
}

const DEFAULT_CACHE_EXPIRATION = 60 * 1000;

export class CoinGecko {
  private cache: ICache;
  private http: HTTP;
  private log: LogInterface;
  private currentPriceMemoryCache: { [key: string]: { price: number, time: number } } = {};
  private cacheExpiration: number;

  constructor({ cache, http, log, cacheExpiration = DEFAULT_CACHE_EXPIRATION }: CoinGeckoProps) {
    this.cache = cache;
    this.http = http;
    this.log = log.getLogInterface();
    this.cacheExpiration = cacheExpiration;
  }

  async getCurrentPrice(name: string, currency = 'usd') {
    const key = `${name}-${currency}`;
    if (this.currentPriceMemoryCache[key]
      && Date.now() - this.currentPriceMemoryCache[key].time < this.cacheExpiration) {
      return this.currentPriceMemoryCache[key].price;
    }

    const response = await this.http.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${name}&vs_currencies=${currency}`
    );
    if (!response[name]) {
      throw new Error(`${name} is not a valid CoinGecko ID`);
    }
    const price = response[name][currency];
    this.currentPriceMemoryCache[key] = { price, time: Date.now() };
    return price;
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
    this.log.debug(`Optimisticly caching market data for ${name} on ${date}`);

    await Promise.all([
      this.cache.setValue(name, 'price', date, price),
      this.cache.setValue(name, 'market-cap', date, marketCap),
    ]);
  }

  async queryCoingecko(name: string, date: string, currency = 'usd') {
    this.log.debug(`Querying CoinGecko for ${name} on ${date}`);

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