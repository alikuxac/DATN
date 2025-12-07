export class ResponseMetadataDto {
  timestamp: number;
  timezone: string;
  path: string;
  [key: string]: any;
}

export class ResponseDto {
  statusCode: number;
  _metadata: ResponseMetadataDto;
  data?: Record<string, any>;
}