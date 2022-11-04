import { expect } from 'chai';
import { DefiLlama } from '../../src/libs/DefiLlama';
import { HTTP } from '../../src/libs/HTTP';

const expectThrowsAsync = async (call: Promise<any>, errorMessage: string) => {
  let error: any = null
  try {
    await call;
  } catch (err) {
    error = err;
  }
  expect(error).to.be.an('Error');
  if (errorMessage) {
    expect(error.message).to.equal(errorMessage);
  }
}

describe('DefiLlama', function() {
  let defiLlama = new DefiLlama({
    http: new HTTP(),
  });

  beforeEach(() => {
    defiLlama = new DefiLlama({
      http: new HTTP(),
    });
  });

  it('should get current price', async () => {
    let result = await defiLlama.getCurrentPrice('coingecko', 'usd-coin');

    expect(result).to.be.closeTo(1, 0.001);

    result = await defiLlama.getCurrentPrice('ethereum', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

    expect(result).to.be.closeTo(1, 0.001);

    await expectThrowsAsync(
      defiLlama.getCurrentPrice('eth', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
      'Price not found',
    );
  });
});
