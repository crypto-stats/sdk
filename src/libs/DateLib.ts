import addDays from 'date-fns/addDays';
import subDays from 'date-fns/subDays';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_SPAN_REGEX = /^(-?\d+)(?: |-)days$/;

export class DateLib {
  dateToTimestamp(date: string | Date) {
    const _date = (date as string).length ? new Date(date) : (date as Date);
    return Math.floor(_date.getTime() / 1000 / 86400) * 86400;
  }

  formatDate(date: Date, connector = '-') {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join(
      connector
    );
  }

  getYesterdayDate() {
    const date = subDays(new Date(), 1);
    return this.formatDate(date);
  }

  last7Days(date?: Date) {
    return [...new Array(7)]
      .map((_, num: number) => this.formatDate(subDays(date || new Date(), 7 - num)));
  }

  isBefore(date?: string, comparrison?: string) {
    if (!date) {
      return true;
    }
    const _comparrison = comparrison || this.formatDate(new Date());
    return new Date(date) < new Date(_comparrison);
  }

  getDateRange(dateStart: string | Date, dateEnd: string | Date) {
    let _dateStart = null;
    let _dateEnd = null;

    if (dateStart instanceof Date) {
      _dateStart = dateStart;
    } else if (DATE_REGEX.test(dateStart)) {
      _dateStart = new Date(dateStart);
    }

    if (dateEnd instanceof Date) {
      _dateEnd = dateEnd;
    } else if (DATE_REGEX.test(dateEnd)) {
      _dateEnd = new Date(dateEnd);
    }

    if (DATE_SPAN_REGEX.test(dateStart as string)) {
      if (!_dateEnd) {
        throw new Error(`End date (${dateEnd}) is invalid for relative date range (${dateStart})`);
      }

      const numDays = parseInt(DATE_SPAN_REGEX.exec(dateStart as string)![1]);
      _dateStart = subDays(_dateEnd, numDays);
    }

    if (DATE_SPAN_REGEX.test(dateEnd as string)) {
      if (!_dateStart) {
        throw new Error(`End date (${dateEnd}) is invalid for relative date range (${dateStart})`);
      }

      const numDays = parseInt(DATE_SPAN_REGEX.exec(dateEnd as string)![1]);
      _dateEnd = addDays(_dateStart, numDays);
    }

    if (!_dateStart) {
      throw new Error(`Invalid date ${dateStart}`);
    }
    if (!_dateEnd) {
      throw new Error(`Invalid date ${dateEnd}`);
    }

    if (_dateEnd < _dateStart) {
      let tmp = _dateStart;
      _dateStart = _dateEnd;
      _dateEnd = tmp;
    }

    const days = [];
    for (let date = _dateStart; date <= _dateEnd; date = addDays(date, 1)) {
      days.push(this.formatDate(date));
    }

    return days;
  }

  offsetDaysFormatted(date: string, numDays: number) {
    return this.formatDate(addDays(new Date(date), numDays));
  }
}
