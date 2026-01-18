import { Module } from '@nestjs/common';
import { SessionRepositoryModule } from '@modules/session/repository/session.repository.module';
import { SessionService } from '@modules/session/services/session.service';
import { SessionTaskService } from '@modules/session/services/session.task.service';

@Module({
    imports: [SessionRepositoryModule, ],
    exports: [SessionService, SessionTaskService],
    providers: [SessionService, SessionTaskService],
    controllers: [],
})
export class SessionModule { }
