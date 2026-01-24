import { Injectable } from '@nestjs/common';
import {
  PAGINATION_AVAILABLE_ORDER_BY,
  PAGINATION_MAX_PER_PAGE,
  PAGINATION_ORDER_BY,
  PAGINATION_ORDER_DIRECTION,
  PAGINATION_PAGE,
  PAGINATION_PER_PAGE,
} from '../constants/pagination.constant';
import { IPaginationOrder, IDateFilterParams } from '../interfaces/pagination.interface';
import { DatabaseService } from '@common/database/services/database.service';

@Injectable()
export class PaginationService {
  constructor(private readonly databaseService: DatabaseService) { }
  offset(page: number, perPage: number): number {
    perPage =
      perPage > PAGINATION_MAX_PER_PAGE ? PAGINATION_MAX_PER_PAGE : perPage;
    const offset: number = (page - 1) * perPage;

    return offset;
  }

  totalPage(totalData: number, perPage: number): number {
    let totalPage = Math.ceil(totalData / perPage);
    totalPage = totalPage === 0 ? 1 : totalPage;
    return totalPage;
  }

  offsetWithoutMax(page: number, perPage: number): number {
    const offset: number = (page - 1) * perPage;
    return offset;
  }

  totalPageWithoutMax(totalData: number, perPage: number): number {
    let totalPage = Math.ceil(totalData / perPage);
    totalPage = totalPage === 0 ? 1 : totalPage;
    return totalPage;
  }

  page(page?: number): number {
    return page;
  }

  perPage(perPage?: number): number {
    return perPage
      ? perPage > PAGINATION_MAX_PER_PAGE
        ? PAGINATION_MAX_PER_PAGE
        : perPage
      : PAGINATION_PER_PAGE;
  }

  order(
    orderByValue = PAGINATION_ORDER_BY,
    orderDirectionValue = PAGINATION_ORDER_DIRECTION,
    availableOrderBy = PAGINATION_AVAILABLE_ORDER_BY,
  ): IPaginationOrder {
    const orderBy: string = availableOrderBy.includes(orderByValue)
      ? orderByValue
      : PAGINATION_ORDER_BY;

    return { [orderBy]: orderDirectionValue };
  }

  search(
    searchValue = '',
    availableSearch: string[],
  ): Record<string, any> | undefined {
    if (!searchValue) {
      return undefined;
    }

    return {
      $or: availableSearch.map((val) => ({
        [val]: {
          $regex: new RegExp(searchValue),
          $options: 'i',
        },
      })),
    };
  }

  filterEqual<T = string>(field: string, filterValue: T): Record<string, T> {
    return { [field]: filterValue };
  }

  filterContain(
    field: string,
    filterValue: string,
  ): Record<string, { $regex: RegExp; $options: string }> {
    return {
      [field]: {
        $regex: new RegExp(filterValue),
        $options: 'i',
      },
    };
  }

  filterContainFullMatch(
    field: string,
    filterValue: string,
  ): Record<string, { $regex: RegExp; $options: string }> {
    return {
      [field]: {
        $regex: new RegExp(`\\b${filterValue}\\b`),
        $options: 'i',
      },
    };
  }

  filterIn<T = string>(
    field: string,
    filterValue: T[],
  ): Record<string, { $in: T[] }> {
    return {
      [field]: {
        $in: filterValue,
      },
    };
  }

  filterDate(field: string, filterValue: Date): Record<string, Date> {
    return {
      [field]: filterValue,
    };
  }

  buildDateQuery(
    params: IDateFilterParams,
    allowedFields: string[] = ['createdAt', 'updatedAt'] // Default allow list
  ): Record<string, any> {
    const { dateField, timeRange, fromDate, toDate, exactDate } = params;

    // 1. Validate field name (Security check)
    // Nếu field gửi lên không nằm trong whitelist -> Fallback về field đầu tiên (thường là createdAt)
    const targetField =
      dateField && allowedFields.includes(dateField)
        ? dateField
        : allowedFields[0];

    // 2. Logic Priority: Exact > Between > Gte/Lte > Range
    if (exactDate) {
      // Xử lý tìm chính xác trong ngày
      const startOfDay = new Date(exactDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(exactDate);
      endOfDay.setHours(23, 59, 59, 999);

      return this.databaseService.filterDateBetween(targetField, targetField, startOfDay, endOfDay);
    }

    if (fromDate && toDate) {
      return this.databaseService.filterDateBetween(targetField, targetField, fromDate, toDate);
    }

    if (fromDate) {
      return this.databaseService.filterGte(targetField, fromDate);
    }

    if (toDate) {
      return this.databaseService.filterLte(targetField, toDate);
    }

    if (timeRange) {
      return this.databaseService.filterGte(targetField, timeRange);
    }

    // Không có điều kiện nào -> Trả về rỗng
    return {};
  }
}
