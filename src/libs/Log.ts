export enum LOG_LEVEL {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

interface LogOptions {
  onLog?: (level: LOG_LEVEL, ...args: any[]) => void
}

export interface LogInterface {
  log(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
}

const defaultListener = (level: LOG_LEVEL, ...args: any[]) => {
  switch (level) {
    case LOG_LEVEL.DEBUG:
      console.debug(...args);
      return;

    case LOG_LEVEL.INFO:
      console.info(...args);
      return;

    case LOG_LEVEL.WARN:
      console.warn(...args);
      return;

    case LOG_LEVEL.ERROR:
      console.error(...args);
      return;
  }
}

export class Log {
  private logListener: (level: LOG_LEVEL, ...args: any[]) => void;

  constructor({ onLog }: LogOptions = {}) {
    this.logListener = onLog || defaultListener;
  }

  getLogInterface(): LogInterface {
    return {
      debug: (...args: any[]) => this.logListener(LOG_LEVEL.DEBUG, ...args),
      info: (...args: any[]) => this.logListener(LOG_LEVEL.INFO, ...args),
      log: (...args: any[]) => this.logListener(LOG_LEVEL.INFO, ...args),
      warn: (...args: any[]) => this.logListener(LOG_LEVEL.WARN, ...args),
      error: (...args: any[]) => this.logListener(LOG_LEVEL.ERROR, ...args),
    };
  }
}
