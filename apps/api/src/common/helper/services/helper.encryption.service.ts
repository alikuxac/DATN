import { Injectable } from '@nestjs/common';
import { AES, enc, mode, pad } from 'crypto-js';

@Injectable()
export class HelperEncryptionService {
  constructor() {}

  base64Encrypt(data: string): string {
    const buff: Buffer = Buffer.from(data, 'utf8');
    return buff.toString('base64');
  }

  base64Decrypt(data: string): string {
    const buff: Buffer = Buffer.from(data, 'base64');
    return buff.toString('utf8');
  }

  base64Compare(clientBasicToken: string, ourBasicToken: string): boolean {
    return ourBasicToken === clientBasicToken;
  }

  aes256Encrypt(
    data: string | Record<string, any> | Record<string, any>[],
    key: string,
    iv: string,
  ): string {
    const cIv = enc.Utf8.parse(iv);
    const cipher = AES.encrypt(JSON.stringify(data), key, {
      mode: mode.CBC,
      padding: pad.Pkcs7,
      iv: cIv,
    });

    return cipher.toString();
  }

  aes256Decrypt<T = Record<string, any>>(
    encrypted: string,
    key: string,
    iv: string,
  ): T {
    const cIv = enc.Utf8.parse(iv);
    const cipher = AES.decrypt(encrypted, key, {
      mode: mode.CBC,
      padding: pad.Pkcs7,
      iv: cIv,
    });

    return JSON.parse(cipher.toString(enc.Utf8));
  }
}
