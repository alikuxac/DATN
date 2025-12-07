import { Injectable } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { HelperDateService } from './helper.date.service';

@Injectable()
export class HelperStringService {
  constructor(private readonly helperDateService: HelperDateService) {}

  checkEmail(email: string): boolean {
    const regex = /\S+@\S+\.\S+/;
    return regex.test(email);
  }

  randomReference(length: number, prefix?: string): string {
    const timestamp = `${this.helperDateService.timestamp()}`;
    const randomString: string = this.random(length);

    return prefix
      ? `${prefix}-${timestamp}${randomString}`
      : `${timestamp}${randomString}`;
  }

  random(length: number): string {

    return faker.internet.password(length);
  }

  censor(value: string): string {
    const length = value.length;
    if (length === 1) {
      return value;
    }

    const end = length > 4 ? length - 4 : 1;
    const censorString = '*'.repeat(end > 10 ? 10 : end);
    const visibleString = value.substring(end, length);
    return `${censorString}${visibleString}`;
  }

  checkPasswordWeak(password: string, length?: number): boolean {
    const regex = new RegExp(`^(?=.*?[A-Z])(?=.*?[a-z]).{${length ?? 8},}$`);

    return regex.test(password);
  }

  checkPasswordMedium(password: string, length?: number): boolean {
    const regex = new RegExp(
      `^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{${length ?? 8},}$`,
    );

    return regex.test(password);
  }

  checkPasswordStrong(password: string, length?: number): boolean {
    const regex = new RegExp(
      `^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{${
        length ?? 8
      },}$`,
    );

    return regex.test(password);
  }

  checkPasswordStrength(
    password: string,
    length?: number,
  ): boolean {
    const regex = new RegExp(
      `^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{${length ?? 8},}$`
    );

    return regex.test(password);
  }

  checkSafeString(text: string): boolean {
    const regex = new RegExp('^[A-Za-z0-9_-]+$');
    return regex.test(text);
  }

  reseverse(text: string): string {
    return Array.from(text).reverse().join('');
  }

  ascii(text: string) {
    return text
      .split('')
      .map((char) => char.charCodeAt(0))
      .join(' ');
  }
}
