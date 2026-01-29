import { Inject, Injectable, mixin, Type } from '@nestjs/common';
import { PipeTransform, Scope } from '@nestjs/common/interfaces';
import { REQUEST } from '@nestjs/core';
import { PaginationService } from '@common/pagination/services/pagination.service';
import { IRequestApp } from '@common/request/interfaces/request.interface';

export function PaginationPagingPipe(
  defaultPerPage: number,
): Type<PipeTransform> {
  @Injectable({ scope: Scope.REQUEST })
  class MixinPaginationPagingPipe implements PipeTransform {
    constructor(
      @Inject(REQUEST) protected readonly request: IRequestApp,
      private readonly paginationService: PaginationService,
    ) { }

    async transform(value: Record<string, any>): Promise<Record<string, any>> {
      let page: number;
      let perPage: number;
      let offset: number;

      if (value?._offset !== undefined && value?._limit !== undefined) {
        offset = Number.parseInt(value._offset as string);
        perPage = Number.parseInt(value._limit as string);
        page = Math.floor(offset / perPage) + 1;
      } else {
        page = this.paginationService.page(
          value?.page ? Number.parseInt(value?.page as string) : 1
        );
        perPage = this.paginationService.perPage(
          value?.perPage ? Number.parseInt(value?.perPage as string) : defaultPerPage,
        );
        offset = this.paginationService.offset(page, perPage);
      }

      this.request.__pagination = {
        ...this.request.__pagination,
        page,
        perPage,
      };

      return {
        ...value,
        page,
        perPage,
        _limit: perPage,
        _offset: offset,
      };
    }
  }

  return mixin(MixinPaginationPagingPipe);
}
