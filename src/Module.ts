import vm from 'vm'
import { Context } from './Context'
import { SetupFn } from './types';

interface ModuleProps {
  code?: string;
  setupFn?: SetupFn;
  context: Context;
  name?: string;
  version?: string;
  license?: string;
  sourceFile?: string;
}

export class Module {
  name: string | null;
  version: string | null;
  license: string | null;
  sourceFile: string | null;

  private code: string | null;
  private setupFn: SetupFn | null = null;
  private context: Context;

  constructor({ code, setupFn, context, name, version, license, sourceFile }: ModuleProps) {
    if (code && setupFn) {
      throw new Error('Can not provide code and setup function');
    }
    if (!code && !setupFn) {
      throw new Error('Must provide at least code or setup fuction');
    }
    this.code = code || null;
    this.setupFn = setupFn || null;
    this.name = name || null;
    this.version = version || null;
    this.license = license || null;
    this.sourceFile = sourceFile || null;
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
    this.name = vmModule.exports.name || null;
    this.version = vmModule.exports.version || null;
    this.license = vmModule.exports.license || null;
    this.sourceFile = vmModule.exports.sourceFile || null;
  }

  setup() {
    if (!this.setupFn) {
      throw new Error('Code not evaluated');
    }

    this.setupFn(this.context);
  }
}
