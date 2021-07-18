import vm from 'vm'
import { Adapter } from './Adapter'
import { Context } from './Context'

export class Module {
  private code: string;
  private setupFn: Function | null = null;
  public adapters: Adapter[] = [];
  private context: Context;

  constructor(code: string, context: Context) {
    this.code = code;
    this.context = context;
  }

  evaluate() {
    const vmModule: any = { exports: {} };
    const vmContext = vm.createContext({
      exports: vmModule.exports,
      module: vmModule
    });
    const script = new vm.Script(this.code);

    script.runInContext(vmContext);

    if (!vmModule.exports.setup) {
      throw new Error('Adapter did not export a setup function')
    }
    this.setupFn = vmModule.exports.setup;
  }

  setup() {
    if (!this.setupFn) {
      throw new Error(`Code not evaluated`)
    }

    this.setupFn(this.context);
  }
}
