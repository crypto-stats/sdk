const defineProp = (function() {
  try {
    Object.defineProperty({}, '_', {});
    return function(obj: any, name: string, value: any) {
      Object.defineProperty(obj, name, {
        writable: true,
        enumerable: false,
        configurable: true,
        value: value
      })
    };
  } catch(e) {
    return function(obj: any, name: string, value: any) {
      obj[name] = value;
    };
  }
}());

const globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'];

export class Script {
  public code: string;
  public iframe: HTMLIFrameElement | null = null;

  constructor(code: string) {
    this.code = code;
  }

  runInContext(context: any) {
    const iframe = document.createElement('iframe');
    if (!iframe.style) {
      // @ts-ignore
      iframe.style = {};
    }
    iframe.style.display = 'none';

    document.body.appendChild(iframe);

    const win: any = iframe.contentWindow
    let wEval = win.eval
    const wExecScript = win.execScript

    if (!wEval && wExecScript) {
      // win.eval() magically appears when this is called in IE:
      wExecScript.call(win, 'null');
      wEval = win.eval;
    }

    Object.keys(context).forEach((key: string) => {
      win[key] = context[key];
    });

    globals.forEach((key) => {
      if (context[key]) {
        win[key] = context[key];
      }
    });

    var winKeys = Object.keys(win);

    var res = wEval.call(win, this.code);

    Object.keys(win).forEach((key: string) => {
      // Avoid copying circular objects like `top` and `window` by only
      // updating existing context properties or new properties in the `win`
      // that was only introduced after the eval.
      if (key in context || winKeys.indexOf(key) === -1) {
        context[key] = win[key];
      }
    });

    globals.forEach((key: string) => {
      if (!(key in context)) {
        defineProp(context, key, win[key]);
      }
    });

    // document.body.removeChild(iframe);
    this.iframe = iframe;

    return res;
  }

  cleanup() {
    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
    }
  }
}

export function createContext(context: any) {
  const copy: any = {};
  copy.prototype = {};

  Object.keys(context).forEach((key: string) => {
    copy[key] = context[key];
  });

  return copy;
};
