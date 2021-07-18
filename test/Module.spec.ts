import { expect } from 'chai';
import { Context } from '../src/Context';
import { List } from '../src/List';
import { Module } from '../src/Module';
import { IPFS } from '../src/libs/IPFS';

describe('Module', function() {
  it('should add adapters to a list using code', async function () {
    this.timeout(5000);

    const ipfs = new IPFS();
    const list = new List('fees');
    const context = new Context({
      coinGecko: {} as any,
      chainData: {} as any,
      date: {} as any,
      graph: {} as any,
      http: {} as any,
      ipfs,
      list,
    });

    const code = `
      module.exports.setup = function setup(context) {
        context.register({
          id: 'polymarket',
          metadata: {
            name: 'Polymarket',
            icon: context.ipfs.getDataURILoader('QmagaZMuMQKU2a5aJ2VofXBNwHmYpzo8GUR9CCjLWbgxTE', 'image/svg+xml'),
          },
        });
      }
    `;

    const polymarketModule = new Module(code, context);
    polymarketModule.evaluate();
    polymarketModule.setup();

    const adapters = list.getAdapters();
    expect(adapters.length).to.equal(1);

    const metadata = await adapters[0].getMetadata();
    expect(metadata).to.deep.equal({
      name: 'Polymarket',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyOCAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI2LjUxOSAzMy4yMjQyTDEuNDQ3NzUgMjYuMDYxVjkuOTQzODVMMjYuNTE5IDE3LjEwN1YzMy4yMjQyWiIgc3Ryb2tlPSIjMDEwMjAyIiBzdHJva2Utd2lkdGg9IjIuNjg2MiIvPgo8cGF0aCBkPSJNMjYuNTE5IDEuODg1MjVMMS40NDc3NSA5LjA0ODQ1VjI1LjE2NTdMMjYuNTE5IDE4LjAwMjVWMS44ODUyNVoiIHN0cm9rZT0iIzAxMDIwMiIgc3Ryb2tlLXdpZHRoPSIyLjY4NjIiLz4KPC9zdmc+Cg==',
    });
  });
});
