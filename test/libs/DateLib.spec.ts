import { expect } from 'chai';
import { DateLib } from '../../src/libs/DateLib';

describe('DateLib', function() {
  const dateLib = new DateLib();

  it('should convert a date to a timestamp', () => {
    expect(dateLib.dateToTimestamp('2021-01-01')).to.equal(1609459200);
  });

  it('should format a date to a string', () => {
    const date = new Date(1609459200000);
    expect(dateLib.formatDate(date)).to.equal('2021-01-01');
  });

  it('should compare dates with isBefore', () => {
    expect(dateLib.isBefore('2021-01-01', '2021-01-02')).to.be.true;
    expect(dateLib.isBefore('2021-01-02', '2021-01-01')).to.be.false;
    expect(dateLib.isBefore('2021-01-01', '2021-01-01')).to.be.false;
  });

  describe('date ranges', function() {
    it('should create a date range', () => {
      const range = dateLib.getDateRange('2021-01-01', '2021-01-05');

      expect(range).to.deep.equal([
        '2021-01-01',
        '2021-01-02',
        '2021-01-03',
        '2021-01-04',
        '2021-01-05',
      ]);
    });

    it('should create a date range with a start offset', () => {
      const range = dateLib.getDateRange('2 days', '2021-01-05');

      expect(range).to.deep.equal([
        '2021-01-03',
        '2021-01-04',
        '2021-01-05',
      ]);
    });

    it('should create a date range with a negative start offset', () => {
      const range = dateLib.getDateRange('-2 days', '2021-01-05');

      expect(range).to.deep.equal([
        '2021-01-05',
        '2021-01-06',
        '2021-01-07',
      ]);
    });

    it('should create a date range with an end offset', () => {
      const range = dateLib.getDateRange('2021-01-05', '2 days');

      expect(range).to.deep.equal([
        '2021-01-05',
        '2021-01-06',
        '2021-01-07',
      ]);
    });

    it('should create a date range with a negative end offset', () => {
      const range = dateLib.getDateRange('2021-01-05', '-2 days');

      expect(range).to.deep.equal([
        '2021-01-03',
        '2021-01-04',
        '2021-01-05',
      ]);
    });
  });

  it('should offset days', () => {
    expect(dateLib.offsetDaysFormatted('2021-01-01', 1)).to.equal('2021-01-02');
    expect(dateLib.offsetDaysFormatted('2021-01-02', -1)).to.equal('2021-01-01');
  });
});
