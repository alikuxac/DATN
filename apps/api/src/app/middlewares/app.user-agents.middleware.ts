import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { UAParser, IResult } from 'ua-parser-js';
import { IRequestApp } from '@common/request/interfaces/request.interface';

@Injectable()
export class AppUserAgentMiddleware implements NestMiddleware {
  use(req: IRequestApp, res: Response, next: NextFunction) {
    const parserUserAgent = new UAParser(req['User-Agent']);
    const userAgent: IResult = parserUserAgent.getResult();

    req.__userAgent = userAgent;
    next()
  }
}
