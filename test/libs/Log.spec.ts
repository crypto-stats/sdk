import { expect } from 'chai';
import { Log, LOG_LEVEL } from '../../src/libs/Log';

describe('Log', function() {
  it('should pass debug events to the listener', (done) => {
    const onLog = (level: LOG_LEVEL, prop1: number, prop2: number) => {
      expect(level).to.equal(LOG_LEVEL.DEBUG);
      expect(prop1).to.equal(5);
      expect(prop2).to.equal(6);
      done();
    }
    const log = new Log({ onLog });

    log.getLogInterface().debug(5, 6);
  });

  it('should pass info events to the listener', (done) => {
    const onLog = (level: LOG_LEVEL, prop1: number, prop2: number) => {
      expect(level).to.equal(LOG_LEVEL.INFO);
      expect(prop1).to.equal(5);
      expect(prop2).to.equal(6);
      done();
    }
    const log = new Log({ onLog });

    log.getLogInterface().info(5, 6);
  });

  it('should pass warn events to the listener', (done) => {
    const onLog = (level: LOG_LEVEL, prop1: number, prop2: number) => {
      expect(level).to.equal(LOG_LEVEL.WARN);
      expect(prop1).to.equal(5);
      expect(prop2).to.equal(6);
      done();
    }
    const log = new Log({ onLog });

    log.getLogInterface().warn(5, 6);
  });

  it('should pass error events to the listener', (done) => {
    const onLog = (level: LOG_LEVEL, prop1: number, prop2: number) => {
      expect(level).to.equal(LOG_LEVEL.ERROR);
      expect(prop1).to.equal(5);
      expect(prop2).to.equal(6);
      done();
    }
    const log = new Log({ onLog });

    log.getLogInterface().error(5, 6);
  });
});
