import { UserEntity } from "@modules/users/repository/entities/user.entity";
import { ReportDocument, ReportEntity } from "../repository/entities/report.entity";

export interface IReportEntity extends Omit<ReportEntity, 'user' | 'by' | 'rescuers'> {
  user: UserEntity;
  by: UserEntity;
  rescuers?: UserEntity[];
}

export interface IReportDocument extends Omit<ReportDocument, 'user' | 'by' | 'rescuers'> {
  user: UserEntity;
  by: UserEntity;
  rescuers?: UserEntity[];
}