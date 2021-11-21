import { expect } from 'chai';
import { Context } from '../src/Context';
import { List } from '../src/List';
import { Module } from '../src/Module';
import { Log } from '../src/libs/Log';
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
      log: new Log(),
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
      log: new Log(),
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
      log: new Log(),
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

  it('should output normal serializable objects', async function () {
    this.timeout(5000);

    function getObjectClassLabel(value: any): string {
      return Object.prototype.toString.call(value)
    }

    function isPlainObject(value: any): boolean {
      if (getObjectClassLabel(value) !== '[object Object]') {
        return false
      }

      const prototype = Object.getPrototypeOf(value)
      return prototype === null || prototype === Object.prototype
    }

    const ipfs = new IPFS();
    const list = new List('fees');
    const context = new Context({
      coinGecko: {} as any,
      chainData: {} as any,
      date: {} as any,
      graph: {} as any,
      http: {} as any,
      ethers: {} as any,
      log: new Log(),
      plugins: {} as any,
      ipfs,
      list,
    });

    const code = `
      module.exports.name = 'Polymarket';
      module.exports.version = '1.0.1';

      module.exports.setup = function setup(context) {
        context.register({
          id: 'polymarket',
          queries: {
            test: async () => ({ value: 1 }),
          },
          metadata: {
            name: 'Polymarket',
            events: [
              { date: '2021-01-01' },
            ],
          },
        });
      }
    `;

    const polymarketModule = new Module({ code, context });
    polymarketModule.evaluate();

    polymarketModule.setup();

    const adapters = list.getAdapters();
    expect(adapters.length).to.equal(1);

    const metadata = await adapters[0].getMetadata();
    expect(isPlainObject(metadata.events[0])).to.be.true;

    const result = await adapters[0].query('test');
    expect(isPlainObject(result)).to.be.true;
  })

  it('should verify signed adapter code', async function () {
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
      log: new Log(),
      plugins: {} as any,
      ipfs,
      list,
    });

    const code = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = exports.license = exports.version = exports.name = void 0;
exports.name = 'Sample Signature';
exports.version = '0.1.2';
exports.license = 'MIT';
function setup() { }
exports.setup = setup;

exports.previousVersion = 'QmeoZNqWDJVPamkzfUU7g7csTKU917yTSwnp9YdoTXewrk';

exports.sourceFile = 'QmakMftxr1j7W2PdiJa1RuhbXTzGL5vKx1TKZRqDQ5bJEp';

exports.signer = '0x3431c5139Bb6F5ba16E4d55EF2420ba8E0E127F6';
exports.signature = '0x99c84bcca90b7ecc61ed01e7466be8a5a091664e1001b4ded231d276e77fde8174a59a04c1782c49d715ef5fd06de34d4f51cc044c02e5a6595a125a57fe06721c';
`;

    const signedModule = new Module({ code, context });
    signedModule.evaluate();

    expect(signedModule.name).to.equal('Sample Signature');
    expect(signedModule.version).to.equal('0.1.2');
    expect(signedModule.license).to.equal('MIT');
    expect(signedModule.sourceFile).to.equal('QmakMftxr1j7W2PdiJa1RuhbXTzGL5vKx1TKZRqDQ5bJEp');
    expect(signedModule.previousVersion).to.equal('QmeoZNqWDJVPamkzfUU7g7csTKU917yTSwnp9YdoTXewrk');
    expect(signedModule.signer).to.equal('0x3431c5139Bb6F5ba16E4d55EF2420ba8E0E127F6');
    expect(signedModule.signature).to.equal('0x99c84bcca90b7ecc61ed01e7466be8a5a091664e1001b4ded231d276e77fde8174a59a04c1782c49d715ef5fd06de34d4f51cc044c02e5a6595a125a57fe06721c');
  });

  it('should reject invalid signature', async function () {
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
      log: new Log(),
      plugins: {} as any,
      ipfs,
      list,
    });

    const code = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = exports.license = exports.version = exports.name = void 0;
exports.name = 'Sample Signature';
exports.version = '0.1.2';
exports.license = 'MIT';
function setup() { }
exports.setup = setup;

exports.previousVersion = 'QmeoZNqWDJVPamkzfUU7g7csTKU917yTSwnp9YdoTXewrk';

exports.sourceFile = 'QmakMftxr1j7W2PdiJa1RuhbXTzGL5vKx1TKZRqDQ5bJEp';

exports.signer = '0x3431c5139Bb6F5ba16E4d55EF2420ba8E0E127F6';
exports.signature = '0x000000cca90b7ecc61ed01e7466be8a5a091664e1001b4ded231d276e77fde8174a59a04c1782c49d715ef5fd06de34d4f51cc044c02e5a6595a125a57fe06721c';
`;

    expect(() => new Module({ code, context })).to.throw('Invalid signature on module');
  });
});
