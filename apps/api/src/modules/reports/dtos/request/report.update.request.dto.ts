import { ReportCreateRequestDto } from './report.create.request.dto';
import { PartialType } from '@nestjs/swagger';

export class ReportUpdateRequestDto extends PartialType(ReportCreateRequestDto) {}