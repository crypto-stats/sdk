import { expect } from 'chai';
import { Context } from '../src/Context';
import { Collection } from '../src/Collection';
import { Module } from '../src/Module';
import { createContext } from './helper';

describe('Module', function() {
  it('should add adapters to a list using code', async function () {
    this.timeout(5000);

    const collection = new Collection('fees');
    const context = createContext({ collection });

    const code = `
      module.exports.name = 'Polymarket';
      module.exports.version = '1.0.1';
      module.exports.license = 'MIT';
      module.exports.sourceFile = 'Qma...';
      module.exports.description = 'Test adapter';
      module.exports.changeLog = 'Change';

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
    expect(polymarketModule.description).to.equal('Test adapter');
    expect(polymarketModule.changeLog).to.equal('Change');

    polymarketModule.setup();

    const adapters = collection.getAdapters();
    expect(adapters.length).to.equal(1);

    const metadata = await adapters[0].getMetadata();
    expect(metadata).to.deep.equal({
      name: 'Polymarket',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyOCAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI2LjUxOSAzMy4yMjQyTDEuNDQ3NzUgMjYuMDYxVjkuOTQzODVMMjYuNTE5IDE3LjEwN1YzMy4yMjQyWiIgc3Ryb2tlPSIjMDEwMjAyIiBzdHJva2Utd2lkdGg9IjIuNjg2MiIvPgo8cGF0aCBkPSJNMjYuNTE5IDEuODg1MjVMMS40NDc3NSA5LjA0ODQ1VjI1LjE2NTdMMjYuNTE5IDE4LjAwMjVWMS44ODUyNVoiIHN0cm9rZT0iIzAxMDIwMiIgc3Ryb2tlLXdpZHRoPSIyLjY4NjIiLz4KPC9zdmc+Cg==',
    });
  });

  it('should add adapters to a list using a function', async function () {
    this.timeout(5000);

    const collection = new Collection('fees');
    const context = createContext({ collection });

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

    const adapters = collection.getAdapters();
    expect(adapters.length).to.equal(1);

    const metadata = await adapters[0].getMetadata();
    expect(metadata).to.deep.equal({
      name: 'Polymarket',
      icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAyOCAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI2LjUxOSAzMy4yMjQyTDEuNDQ3NzUgMjYuMDYxVjkuOTQzODVMMjYuNTE5IDE3LjEwN1YzMy4yMjQyWiIgc3Ryb2tlPSIjMDEwMjAyIiBzdHJva2Utd2lkdGg9IjIuNjg2MiIvPgo8cGF0aCBkPSJNMjYuNTE5IDEuODg1MjVMMS40NDc3NSA5LjA0ODQ1VjI1LjE2NTdMMjYuNTE5IDE4LjAwMjVWMS44ODUyNVoiIHN0cm9rZT0iIzAxMDIwMiIgc3Ryb2tlLXdpZHRoPSIyLjY4NjIiLz4KPC9zdmc+Cg==',
    });
  });

  it('should not allow escaping the sandbox using constructors', () => {
    const collection = new Collection('fees');
    const context = createContext({ collection });

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

    const collection = new Collection('fees');
    const context = createContext({ collection });

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

    const adapters = collection.getAdapters();
    expect(adapters.length).to.equal(1);

    const metadata = await adapters[0].getMetadata();
    expect(isPlainObject(metadata.events[0])).to.be.true;

    const result = await adapters[0].query('test');
    expect(isPlainObject(result)).to.be.true;
  })

  it('should verify signed adapter code', async function () {
    this.timeout(5000);

    const collection = new Collection('fees');
    const context = createContext({ collection });

    const code = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = exports.license = exports.version = exports.name = void 0;
exports.name = 'Sample Signature';
exports.version = '0.1.5';
exports.license = 'MIT';
// Test
function setup() { }
exports.setup = setup;

exports.previousVersion = 'QmPgfKUH1VwiwbLgh4S6UMHXiMhCXQ1knrQfcFvBGeh2Px';

exports.sourceFile = 'QmYbNeEaJGpZ97Ty4ZeFuQSLFy6yhL3j7GiE5W87cyKTBS';

exports.signer = '0x3431c5139Bb6F5ba16E4d55EF2420ba8E0E127F6';
exports.signature = '0x65ac2f14c5808cc56d8dc4409c0557dbe51fb537f6b890bae1cd9dae0f3f94667a7ecc315d0631f44c0cb9e4b2a74f7b9b2c94415690859afd3cb8d6a9ec1dcb1b';
`;

    const signedModule = new Module({ code, context });
    signedModule.evaluate();

    expect(signedModule.name).to.equal('Sample Signature');
    expect(signedModule.version).to.equal('0.1.5');
    expect(signedModule.license).to.equal('MIT');
    expect(signedModule.sourceFile).to.equal('QmYbNeEaJGpZ97Ty4ZeFuQSLFy6yhL3j7GiE5W87cyKTBS');
    expect(signedModule.previousVersion).to.equal('QmPgfKUH1VwiwbLgh4S6UMHXiMhCXQ1knrQfcFvBGeh2Px');
    expect(signedModule.signer).to.equal('0x3431c5139Bb6F5ba16E4d55EF2420ba8E0E127F6');
    expect(signedModule.signature).to.equal('0x65ac2f14c5808cc56d8dc4409c0557dbe51fb537f6b890bae1cd9dae0f3f94667a7ecc315d0631f44c0cb9e4b2a74f7b9b2c94415690859afd3cb8d6a9ec1dcb1b');
  });

  it('should reject invalid signature', async function () {
    this.timeout(5000);

    const collection = new Collection('fees');
    const context = createContext({ collection });

    const code = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setup = exports.license = exports.version = exports.name = void 0;
exports.name = 'Sample Signature';
exports.version = '0.1.4';
exports.license = 'MIT';
// Test
function setup() { }
exports.setup = setup;

exports.previousVersion = 'QmWGfv9wgVTEVEhp2D5YaDF6DPz8enNQDXHSwBUPXuPUPf';

exports.sourceFile = 'QmeQjzBURFYUQ6MEKya2jWyxZ4y9QuVjfk6ecNbqCjYuYL';

exports.signer = '0x3431c5139Bb6F5ba16E4d55EF2420ba8E0E127F6';
exports.signature = '0x00000036a3e64d9eeee638f9467af57b85ef06993dad1b4d86a03849435c68fb78930c4b4985d32217a784ab2aa01c97a16354924b92f653dde92af2e2a6b0031b';
`;

    expect(() => new Module({ code, context })).to.throw('Invalid signature on module');
  });
});
