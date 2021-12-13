import vm from 'vm';
import { ethers } from 'ethers';
import { Context } from './Context'
import { SetupFn } from './types';

interface ModuleProps {
  code?: string;
  setupFn?: SetupFn;
  context: Context;
  name?: string;
  version?: string;
  license?: string;
  description?: string;
  changeLog?: string;
  sourceFile?: string;
  previousVersion?: string;
  executionTimeout?: number;
}

const SIGNATURE_REGEX = /\nexports.signer = ['"](0x[0-9a-fA-F]{40})['"];\nexports.signature = ['"](0x[0-9a-fA-F]{130})['"];\n/

export class Module {
  name: string | null;
  version: string | null;
  license: string | null;
  description: string | null;
  changeLog: string | null;
  sourceFile: string | null;
  previousVersion: string | null;
  signer: string | null = null;
  signature: string | null = null;

  public code: string | null;
  public setupFn: SetupFn | null = null;
  private context: Context;
  private executionTimeout: number;

  constructor({
    code, setupFn, context, name, version, license, description, changeLog, sourceFile, previousVersion, executionTimeout = 30
  }: ModuleProps) {
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
    this.description = description || null;
    this.changeLog = changeLog || null;
    this.sourceFile = sourceFile || null;
    this.previousVersion = previousVersion || null;
    this.context = context;
    this.executionTimeout = executionTimeout;

    if (code) {
      const signatureResults = SIGNATURE_REGEX.exec(code);
      if (signatureResults) {
        const [signatureMetadata, signer, signature] = signatureResults;

        const signedCode = code.replace(signatureMetadata, '');
        const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(signedCode));
        const message = `CryptoStats Adapter Hash: ${hash}`;
        const verifiedSigner = ethers.utils.verifyMessage(message, signature);

        if (verifiedSigner.toLowerCase() !== signer.toLowerCase()) {
          throw new Error('Invalid signature on module');
        }

        this.signer = signer;
        this.signature = signature;
      }
    }
  }

  evaluate() {
    if (this.setupFn || !this.code) {
      throw new Error('Can not evaluate, setup function already set');
    }

    // Node VMs are dangerous! We jump through a bunch of hoops to sandbox the script
    // Really, we should be using a tested package like VM2, however they don't support
    // client-side execution.

    const base = {};
    const handler = {
      get(target: any, key: string) {
        if (key === 'constructor') {
          return Object;
        }
        if (key === '__proto__') {
          return Object.prototype;
        }

        return target[key];
      },
    }

    const vmExports = new Proxy(base, handler);
    const vmModule = new Proxy({ exports: vmExports }, handler);

    const vmContext = vm.createContext({
      exports: vmModule.exports,
      module: vmModule
    });
    // @ts-ignore
    vmContext.constructor = null;

    const script = new vm.Script(this.code);

    script.runInContext(vmContext, {
      // Keep this short, since the execution should only be exporting some variables
      // If scripts are timing out, this can be increased
      timeout: this.executionTimeout,
    });

    if (!vmModule.exports.setup) {
      throw new Error('Adapter did not export a setup function')
    }
    this.setupFn = vmModule.exports.setup;
    this.name = vmModule.exports.name || null;
    this.version = vmModule.exports.version || null;
    this.license = vmModule.exports.license || null;
    this.description = vmModule.exports.description || null;
    this.changeLog = vmModule.exports.changeLog || null;
    this.sourceFile = vmModule.exports.sourceFile || null;
    this.previousVersion = vmModule.exports.previousVersion || null;
  }

  setup() {
    if (!this.setupFn) {
      throw new Error('Code not evaluated');
    }

    this.setupFn(this.context);
  }
}
