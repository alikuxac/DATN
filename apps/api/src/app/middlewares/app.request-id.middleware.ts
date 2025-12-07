import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import { IRequestApp } from '@common/request/interfaces/request.interface';

@Injectable()
export class AppRequestIdMiddleware implements NestMiddleware {
    use(req: IRequestApp, _res: Response, next: NextFunction): void {
        req.__id = uuid();

        next();
    }
}
