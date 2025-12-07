import { ENUM_PAGINATION_ORDER_DIRECTION_TYPE } from '@common/pagination/constants/pagination.enum.constant';
import {
  ResponseDto,
  ResponseMetadataDto,
} from '@common/response/dto/response.dto';
import { PickType } from '@nestjs/swagger';

export class ResponsePagingMetadataPaginationRequestDto {
  search: string;
  
  filters: Record<
    string,
    string | number | boolean | Array<string | number | boolean> | Date
  >;

  page: number;

  perPage: number;

  orderBy: string;

  orderDirection: ENUM_PAGINATION_ORDER_DIRECTION_TYPE;

  availableSearch: string[];

  availableOrderBy: string[];

  availableOrderDirection: ENUM_PAGINATION_ORDER_DIRECTION_TYPE[];

  total?: number;

  totalPage?: number;
}

export class ResponsePagingMetadataDto extends ResponseMetadataDto {
  pagination?: ResponsePagingMetadataPaginationRequestDto;
}

export class ResponsePagingDto extends PickType(ResponseDto, [
  'statusCode',
] as const) {
  _metadata: ResponsePagingMetadataDto;
  data: Record<string, any>[];
}