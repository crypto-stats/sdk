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
      ethers: {} as any,
      plugins: {} as any,
      ipfs,
      list,
    });

    const code = `
      module.exports.name = 'Polymarket';
      module.exports.version = '1.0.1';
      module.exports.license = 'MIT';
      module.exports.sourceFile = 'Qma...';

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

    const polymarketModule = new Module({ code, context });
    polymarketModule.evaluate();

    expect(polymarketModule.name).to.equal('Polymarket');
    expect(polymarketModule.version).to.equal('1.0.1');
    expect(polymarketModule.license).to.equal('MIT');
    expect(polymarketModule.sourceFile).to.equal('Qma...');

    polymarketModule.setup();

    const adapters = list.getAdapters();
    expect(adapters.length).to.equal(1);

    const metadata = await adapters[0].getMetadata();
    expect(metadata).to.deep.equal({
      name: 'Polymarket',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyOCAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI2LjUxOSAzMy4yMjQyTDEuNDQ3NzUgMjYuMDYxVjkuOTQzODVMMjYuNTE5IDE3LjEwN1YzMy4yMjQyWiIgc3Ryb2tlPSIjMDEwMjAyIiBzdHJva2Utd2lkdGg9IjIuNjg2MiIvPgo8cGF0aCBkPSJNMjYuNTE5IDEuODg1MjVMMS40NDc3NSA5LjA0ODQ1VjI1LjE2NTdMMjYuNTE5IDE4LjAwMjVWMS44ODUyNVoiIHN0cm9rZT0iIzAxMDIwMiIgc3Ryb2tlLXdpZHRoPSIyLjY4NjIiLz4KPC9zdmc+Cg==',
    });
  });

  it('should add adapters to a list using a function', async function () {
    this.timeout(5000);

    const ipfs = new IPFS();
    const list = new List('fees');
    const context = new Context({
      coinGecko: {} as any,
      chainData: {} as any,
      date: {} as any,
      graph: {} as any,
      http: {} as any,
      ethers: {} as any,
      plugins: {} as any,
      ipfs,
      list,
    });

    const setupFn = function setup(context: Context) {
      context.register({
        id: 'polymarket',
        queries: {},
        metadata: {
          name: 'Polymarket',
          icon: context.ipfs.getDataURILoader('QmagaZMuMQKU2a5aJ2VofXBNwHmYpzo8GUR9CCjLWbgxTE', 'image/svg+xml'),
        },
      });
    };

    const polymarketModule = new Module({ setupFn, context });
    polymarketModule.setup();

    const adapters = list.getAdapters();
    expect(adapters.length).to.equal(1);

    const metadata = await adapters[0].getMetadata();
    expect(metadata).to.deep.equal({
      name: 'Polymarket',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyOCAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI2LjUxOSAzMy4yMjQyTDEuNDQ3NzUgMjYuMDYxVjkuOTQzODVMMjYuNTE5IDE3LjEwN1YzMy4yMjQyWiIgc3Ryb2tlPSIjMDEwMjAyIiBzdHJva2Utd2lkdGg9IjIuNjg2MiIvPgo8cGF0aCBkPSJNMjYuNTE5IDEuODg1MjVMMS40NDc3NSA5LjA0ODQ1VjI1LjE2NTdMMjYuNTE5IDE4LjAwMjVWMS44ODUyNVoiIHN0cm9rZT0iIzAxMDIwMiIgc3Ryb2tlLXdpZHRoPSIyLjY4NjIiLz4KPC9zdmc+Cg==',
    });
  });

  it('should not allow escaping the sandbox using constructors', () => {
    const ipfs = new IPFS();
    const list = new List('fees');
    const context = new Context({
      coinGecko: {} as any,
      chainData: {} as any,
      date: {} as any,
      graph: {} as any,
      http: {} as any,
      ethers: {} as any,
      plugins: {} as any,
      ipfs,
      list,
    });

    const fail: any = () => {
      throw new Error('Escaped sandbox');
    };
    // @ts-ignore
    global.fail = fail;

    const code = `
      let fail;
      try {
        fail = this.constructor.constructor('return this.fail')();
      } catch (e) { /* Unable to escape */ }
      fail && fail();
      module.exports.setup = function() {} // to prevent other error
    `;

    const polymarketModule = new Module({ code, context });
    polymarketModule.evaluate();
  });
});
