/* eslint-disable no-fallthrough */
import { Injectable } from '@nestjs/common';
import { DateTime, Duration, DurationLikeObject } from 'luxon';
import {
  IHelperDateCreateOptions,
  IHelperDateExtractDate,
  IHelperDateOptionsBackward,
  IHelperDateOptionsCreate,
  IHelperDateOptionsDiff,
  IHelperDateOptionsFormat,
  IHelperDateOptionsForward,
  IHelperDateOptionsRoundDown,
  IHelperDateStartAndEnd,
  IHelperDateStartAndEndDate,
} from '../interfaces/helper.interface';
import { ConfigService } from '@nestjs/config';
import {
  ENUM_HELPER_DATE_DAY_OF,
  ENUM_HELPER_DATE_DIFF,
  ENUM_HELPER_DATE_FORMAT
} from '@repo/shared';

@Injectable()
export class HelperDateService {
  private readonly defTz: string;

  constructor(private readonly configService: ConfigService) {
    this.defTz = this.configService.get<string>('app.timezone');
  }

  calculateAge(dateOfBirth: Date): number {
    const dateTimeOfBirth = DateTime.fromJSDate(dateOfBirth);
    return DateTime.now().diff(dateTimeOfBirth).years;
  }

  diff(
    dateOne: Date,
    dateTwoMoreThanDateOne: Date,
    options?: IHelperDateOptionsDiff,
  ): number {
    const mDateOne = DateTime.fromJSDate(dateOne);
    const mDateTwo = DateTime.fromJSDate(dateTwoMoreThanDateOne);
    const diff = mDateOne.diff(mDateTwo);

    if (options?.format === ENUM_HELPER_DATE_DIFF.MILIS) {
      return diff.milliseconds;
    } else if (options?.format === ENUM_HELPER_DATE_DIFF.SECONDS) {
      return diff.seconds;
    } else if (options?.format === ENUM_HELPER_DATE_DIFF.HOURS) {
      return diff.hours;
    } else if (options?.format === ENUM_HELPER_DATE_DIFF.MINUTES) {
      return diff.minutes;
    } else {
      return diff.days;
    }
  }

  check(date: string | Date | number): boolean {
    switch (typeof date) {
      case 'string':
        return DateTime.fromISO(date).isValid;
      case 'number':
        return DateTime.fromMillis(date).isValid;
      default:
        return DateTime.fromJSDate(date).isValid;
    }
  }

  checkTimestamp(timestamp: number): boolean {
    return DateTime.fromMillis(timestamp).isValid;
  }

  create(
    date?: string | number | Date,
    options?: IHelperDateOptionsCreate,
  ): Date {
    let mDate: DateTime;

    if (date) {
      switch (typeof date) {
        case 'string':
          mDate = DateTime.fromISO(date);
        case 'number':
          mDate = DateTime.fromMillis(Number(date));
        default:
          mDate = DateTime.fromJSDate(date as Date);
      }
    } else {
      mDate = DateTime.now();
    }

    if (options?.startOfDay) {
      mDate.startOf('day');
    }

    return mDate.setZone(this.defTz).toJSDate();
  }

  timestamp(
    date?: string | Date | number,
    options?: IHelperDateOptionsCreate,
  ): number {
    let mDate: DateTime;

    if (date) {
      switch (typeof date) {
        case 'string':
          mDate = DateTime.fromISO(date);
        case 'number':
          mDate = DateTime.fromMillis(Number(date));
        default:
          mDate = DateTime.fromJSDate(date as Date);
      }
    } else {
      mDate = DateTime.now();
    }

    if (options?.startOfDay) {
      mDate.startOf('day');
    }

    return mDate.setZone(this.defTz).valueOf();
  }

  format(date: Date, options?: IHelperDateOptionsFormat): string {
    return DateTime.fromJSDate(date).setZone(this.defTz).toFormat(
      options?.format ?? ENUM_HELPER_DATE_FORMAT.DATE,
    );
  }

  forwardInMilliseconds(
    milliseconds: number,
    options?: IHelperDateOptionsForward,
  ): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate)
        .plus({ millisecond: milliseconds })
        .setZone(this.defTz)
        .toJSDate()
      : DateTime.now().plus({ millisecond: milliseconds })
        .setZone(this.defTz)
        .toJSDate();
  }

  backwardInMilliseconds(
    milliseconds: number,
    options?: IHelperDateOptionsBackward,
  ): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate)
        .minus({ millisecond: milliseconds })
        .toJSDate()
      : DateTime.now().minus({ millisecond: milliseconds }).setZone(this.defTz).toJSDate();
  }

  forwardInSeconds(seconds: number, options?: IHelperDateOptionsForward): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate)
        .plus({ second: seconds })
        .toJSDate()
      : DateTime.now().plus({ second: seconds }).setZone(this.defTz).toJSDate();
  }

  backwardInSeconds(
    seconds: number,
    options?: IHelperDateOptionsBackward,
  ): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate)
        .minus({ second: seconds })
        .toJSDate()
      : DateTime.now().minus({ second: seconds }).setZone(this.defTz).toJSDate();
  }

  forwardInMinutes(minutes: number, options?: IHelperDateOptionsForward): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate)
        .plus({ minute: minutes })
        .toJSDate()
      : DateTime.now().plus({ minute: minutes }).setZone(this.defTz).toJSDate();
  }

  backwardInMinutes(
    minutes: number,
    options?: IHelperDateOptionsBackward,
  ): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate)
        .minus({ minute: minutes })
        .toJSDate()
      : DateTime.now().minus({ minute: minutes }).setZone(this.defTz).toJSDate();
  }

  forwardInHours(hours: number, options?: IHelperDateOptionsForward): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate).plus({ hour: hours }).setZone(this.defTz).toJSDate()
      : DateTime.now().plus({ hour: hours }).setZone(this.defTz).toJSDate();
  }

  backwardInHours(hours: number, options?: IHelperDateOptionsBackward): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate).minus({ hour: hours }).setZone(this.defTz).toJSDate()
      : DateTime.now().minus({ hour: hours }).setZone(this.defTz).toJSDate();
  }

  forwardInDays(days: number, options?: IHelperDateOptionsForward): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate).plus({ day: days }).setZone(this.defTz).toJSDate()
      : DateTime.now().plus({ day: days }).setZone(this.defTz).toJSDate();
  }

  backwardInDays(days: number, options?: IHelperDateOptionsBackward): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate).minus({ day: days }).setZone(this.defTz).toJSDate()
      : DateTime.now().minus({ day: days }).setZone(this.defTz).toJSDate();
  }

  forwardInMonths(months: number, options?: IHelperDateOptionsForward): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate).plus({ month: months }).setZone(this.defTz).toJSDate()
      : DateTime.now().plus({ month: months }).setZone(this.defTz).toJSDate();
  }

  backwardInMonths(months: number, options?: IHelperDateOptionsBackward): Date {
    return options?.fromDate
      ? DateTime.fromJSDate(options.fromDate)
        .minus({ month: months }).setZone(this.defTz)
        .toJSDate()
      : DateTime.now().minus({ month: months }).setZone(this.defTz).toJSDate();
  }

  endOfMonth(date?: Date): Date {
    return DateTime.fromJSDate(date).endOf('month').setZone(this.defTz).toJSDate();
  }

  startOfMonth(date?: Date): Date {
    return DateTime.fromJSDate(date).startOf('month').setZone(this.defTz).toJSDate();
  }

  endOfYear(date?: Date): Date {
    return DateTime.fromJSDate(date).endOf('year').setZone(this.defTz).toJSDate();
  }

  startOfYear(date?: Date): Date {
    return date
      ? DateTime.fromJSDate(date).startOf('year').setZone(this.defTz).toJSDate()
      : DateTime.now().startOf('year').setZone(this.defTz).toJSDate();
  }

  endOfDay(date?: Date): Date {
    return date
      ? DateTime.fromJSDate(date).endOf('day').setZone(this.defTz).toJSDate()
      : DateTime.now().endOf('day').setZone(this.defTz).toJSDate();
  }

  startOfDay(date?: Date): Date {
    return date
      ? DateTime.fromJSDate(date).startOf('day').setZone(this.defTz).toJSDate()
      : DateTime.now().startOf('day').setZone(this.defTz).toJSDate();
  }

  extractDate(date: string | Date | number): IHelperDateExtractDate {
    const newDate = this.create(date);
    const day: string = this.format(newDate, {
      format: ENUM_HELPER_DATE_FORMAT.ONLY_DATE,
    });
    const month: string = this.format(newDate, {
      format: ENUM_HELPER_DATE_FORMAT.ONLY_MONTH,
    });
    const year: string = this.format(newDate, {
      format: ENUM_HELPER_DATE_FORMAT.ONLY_YEAR,
    });

    return {
      date: newDate,
      day,
      month,
      year,
    };
  }

  roundDown(date: Date, options?: IHelperDateOptionsRoundDown): Date {
    const mDate = DateTime.fromJSDate(date).set({ millisecond: 0 });

    if (options?.hour) {
      mDate.set({ hour: 0 });
    }

    if (options?.minute) {
      mDate.set({ minute: 0 });
    }

    if (options?.second) {
      mDate.set({ second: 0 });
    }

    return mDate.toJSDate();
  }

  getStartAndEndDate(
    options?: IHelperDateStartAndEnd,
  ): IHelperDateStartAndEndDate {
    const today = DateTime.now();
    const todayMonth = today.toFormat(ENUM_HELPER_DATE_FORMAT.ONLY_MONTH);
    const todayYear = today.toFormat(ENUM_HELPER_DATE_FORMAT.ONLY_YEAR);
    // set month and year
    const year = options?.year ?? todayYear;
    const month = options?.month ?? todayMonth;

    const date = DateTime.fromFormat(`${year}-${month}-02`, 'YYYY-MM-DD');
    let startDate: Date = date.startOf('year').toJSDate();
    let endDate: Date = date.endOf('year').toJSDate();

    if (options?.month) {
      const date = DateTime.fromFormat(`${year}-${month}-02`, 'YYYY-MM-DD');
      startDate = date.startOf('month').toJSDate();
      endDate = date.endOf('month').toJSDate();
    }

    return {
      startDate,
      endDate,
    };
  }

  forward(date: Date, duration: Duration): Date {
    return DateTime.fromJSDate(date)
      .setZone(this.defTz)
      .plus(duration)
      .toJSDate();
  }

  createDuration(duration: DurationLikeObject): Duration {
    return Duration.fromObject(duration);
  }

  createFromIso(iso: string, options?: IHelperDateCreateOptions): Date {
    const date = DateTime.fromISO(iso).setZone(this.defTz);

    if (
      options?.dayOf &&
      options?.dayOf === ENUM_HELPER_DATE_DAY_OF.START
    ) {
      date.startOf('day');
    } else if (
      options?.dayOf &&
      options?.dayOf === ENUM_HELPER_DATE_DAY_OF.END
    ) {
      date.endOf('day');
    }

    return date.toJSDate();
  }

  getTimestamp(date: Date): number {
    return DateTime.fromJSDate(date).setZone(this.defTz).toMillis();
  }

  getZone(date: Date): string {
    return DateTime.fromJSDate(date).setZone(this.defTz).zone.name;
  }

  formatToRFC2822(date: Date): string {
    return DateTime.fromJSDate(date).setZone(this.defTz).toRFC2822();
  }

  formatToIso(date: Date): string {
    return DateTime.fromJSDate(date).setZone(this.defTz).toISO();
  }

  formatToIsoDate(date: Date): string {
    return DateTime.fromJSDate(date).setZone(this.defTz).toISODate();
  }
}
