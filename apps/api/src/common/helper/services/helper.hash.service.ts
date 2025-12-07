import { Injectable } from '@nestjs/common';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { SHA256, enc } from 'crypto-js';

@Injectable()
export class HelperHashService {
  randomSalt(length: number): string {
    return genSaltSync(length);
  }

  bcrypt(passwordString: string, salt: string): string {
    return hashSync(passwordString, salt);
  }

  bcryptCompare(passwordString: string, passwordHashed: string): boolean {
    return compareSync(passwordString, passwordHashed);
  }

  sha256(string: string): string {
    return SHA256(string).toString(enc.Hex);
  }

  sha256Compare(hashOne: string, hashTwo: string): boolean {
    return hashOne === hashTwo;
  }

  encodeBase64(text: string) {
    return Buffer.from(text).toString('base64');
  }

  decodeBase64(text: string) {
    return Buffer.from(text, 'base64').toString('ascii');
  }
}
