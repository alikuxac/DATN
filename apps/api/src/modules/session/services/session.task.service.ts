import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionService } from '@modules/session/services/session.service';

@Injectable()
export class SessionTaskService {
  constructor(private readonly sessionService: SessionService) { }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanUpExpiredSessions(): Promise<void> {
    try {
      await this.sessionService.deleteExpired();
    } catch (err: any) {
      console.error('Session Task Clean Up Expired Sessions Error:', err);
    }
  }
}
