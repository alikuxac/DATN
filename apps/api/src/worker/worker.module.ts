import { Module } from '@nestjs/common';
import { EmailModule } from '@modules/email/email.module';
import { EmailProcessor } from '@modules/email/processors/email.processor';
import { SessionModule } from '@modules/session/session.module';

@Module({
    imports: [EmailModule, SessionModule],
    providers: [EmailProcessor],
})
export class WorkerModule {}
