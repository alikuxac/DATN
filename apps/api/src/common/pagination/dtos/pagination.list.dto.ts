import { ApiHideProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { ENUM_PAGINATION_ORDER_DIRECTION_TYPE } from '@repo/shared';
import { IPaginationOrder } from '../interfaces/pagination.interface';

export class PaginationListDto {
  @ApiHideProperty()
  @Allow()
  _search: Record<string, any>;

  @ApiHideProperty()
  @Allow()
  search?: string;

  @ApiHideProperty()
  @Allow()
  _limit: number;

  @ApiHideProperty()
  @Allow()
  _offset: number;

  @ApiHideProperty()
  @Allow()
  _order: IPaginationOrder;

  @ApiHideProperty()
  @Allow()
  _availableOrderBy: string[];

  @ApiHideProperty()
  @Allow()
  _availableOrderDirection: ENUM_PAGINATION_ORDER_DIRECTION_TYPE[];
}
