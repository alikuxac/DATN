import { UserEntity } from "@modules/users/repository/entities/user.entity";
import { ReportDocument, ReportEntity } from "../repository/entities/report.entity";

export interface IReportEntity extends Omit<ReportEntity, 'user' | 'by'> {
  user: UserEntity;
  by: UserEntity
}

export interface IReportDocument extends Omit<ReportDocument, 'user' | 'by'> {
  user: UserEntity;
  by: UserEntity
}