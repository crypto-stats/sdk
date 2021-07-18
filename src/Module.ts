import vm from 'vm'
import { Adapter } from './Adapter'
import { Context } from './Context'

type SetupFn = (context: Context) => void;

interface ModuleProps {
  code?: string;
  setupFn?: SetupFn;
  context: Context;
}

export class Module {
  private code: string | null;
  private setupFn: SetupFn | null = null;
  public adapters: Adapter[] = [];
  private context: Context;

  constructor({ code, setupFn, context }: ModuleProps) {
    if (code && setupFn) {
      throw new Error('Can not provide code and setup function');
    }
    if (!code && !setupFn) {
      throw new Error('Must provide at least code or setup fuction');
    }
    this.code = code || null;
    this.setupFn = setupFn || null;
    this.context = context;
  }

  evaluate() {
    if (this.setupFn || !this.code) {
      throw new Error('Can not evaluate, setup function already set');
    }

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
      throw new Error('Code not evaluated');
    }

    this.setupFn(this.context);
  }
}
