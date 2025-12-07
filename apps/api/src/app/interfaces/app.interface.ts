import { ValidationError } from 'class-validator';
import { IResponseMetadata } from '@common/response/interfaces/response.interface';

export interface IAppException {
  statusCode: number;
  errors?: ValidationError[];
  message?: string;
  data?: Record<string, any>;
  _metadata?: IResponseMetadata;
}

export interface IAppImportException extends Omit<IAppException, 'errors'> {
  statusCode: number;
  data?: Record<string, any>;
  _metadata?: IResponseMetadata;
}