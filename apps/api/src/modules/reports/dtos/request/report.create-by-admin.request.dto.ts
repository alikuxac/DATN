import { IsNotEmpty, IsString } from "class-validator";
import { ReportCreateRequestDto } from "./report.create.request.dto";

export class ReportCreateByAdminRequestDto extends ReportCreateRequestDto {
  @IsString()
  @IsNotEmpty()
  userId: string
}