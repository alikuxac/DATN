import { Injectable } from '@nestjs/common';
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

  mapHttpCode(customCode: number): number {
  if (customCode >= 5000 && customCode < 5100) return 500; // System Error
  if (customCode >= 5100 && customCode < 5200) return 401; // Unauthorized
  if (customCode >= 5200 && customCode < 5300) return 403; // Forbidden
  return 400; // Bad Request (User, Verification...)
}
}
