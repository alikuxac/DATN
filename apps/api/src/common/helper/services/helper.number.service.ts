import { HttpStatus, Injectable } from '@nestjs/common';
import { faker } from '@faker-js/faker';

@Injectable()
export class HelperNumberService {
  check(number: string): boolean {
    const regex = /^-?\d+$/;
    return regex.test(number);
  }

  create(number: string): number {
    return Number(number);
  }

  random(length: number): number {
    const min: number = Number.parseInt(`1`.padEnd(length, '0'));
    const max: number = Number.parseInt(`9`.padEnd(length, '9'));
    return this.randomInRange(min, max);
  }

  randomInRange(min: number, max: number): number {
    return faker.datatype.number({ min, max });
  }

  percent(value: number, total: number): number {
    let tValue = value / total;
    if (Number.isNaN(tValue) || !Number.isFinite(tValue)) {
      tValue = 0;
    }
    return Number.parseFloat((tValue * 100).toFixed(2));
  }

  mapHttpCode(customCode: number): HttpStatus {
    if (!customCode || customCode === 200) {
      return HttpStatus.OK;
    }

    if (customCode < 600) {
      return customCode;
    }

    const httpStatus = Math.floor(customCode / 100);

    if (httpStatus > 600 || httpStatus < 100) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    return httpStatus;
  }
}
