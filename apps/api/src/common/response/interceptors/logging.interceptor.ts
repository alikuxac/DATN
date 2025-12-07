import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    const appEnv = this.configService.get<string>('app.env');
    if (appEnv === 'development') {
      console.time('Request-Response time');
    }
    return next.handle().pipe(
      tap(() => {
        if (appEnv === 'development') {
          console.timeEnd('Request-Response time');
        }
      }),
    );
  }
}
