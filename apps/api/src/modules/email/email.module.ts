import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EmailService } from '@modules/email/services/email.service';
import { EmailTemplateService } from '@modules/email/services/email.template.service';

@Module({
    imports: [HttpModule],
    providers: [EmailService, EmailTemplateService],
    exports: [EmailService, EmailTemplateService],
})
export class EmailModule {}
