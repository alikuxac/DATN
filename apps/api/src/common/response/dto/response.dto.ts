export class ResponseMetadataDto {
  language: string;
  timestamp: number;
  timezone: string;
  path: string;
  [key: string]: any;
}

export class ResponseDto {
  statusCode: number;
  message: string;
  _metadata: ResponseMetadataDto;
  data?: Record<string, any>;
}