import { IsNotEmpty, IsString } from "class-validator";
import { ReportCreateRequestDto } from "./report.create.request.dto";
import { IReportCreateByAdminRequest } from "@repo/shared";
export class ReportCreateByAdminRequestDto extends ReportCreateRequestDto implements IReportCreateByAdminRequest {
  @IsString()
  @IsNotEmpty()
  userId: string
}