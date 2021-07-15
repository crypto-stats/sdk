import addDays from 'date-fns/addDays';
import subDays from 'date-fns/subDays';

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
    const _dateStart = dateStart instanceof Date ? dateStart : new Date(dateStart);
    const _dateEnd = dateEnd instanceof Date ? dateEnd : new Date(dateEnd);

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
