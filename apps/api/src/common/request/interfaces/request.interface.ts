import { Request } from 'express';
import { ResponsePagingMetadataPaginationRequestDto } from '@common/response/dto/response.paging.dto';
import { IAuthJwtAccessTokenPayload } from '@modules/auth/interfaces/auth.interface';
import { UserEntity } from '@modules/users/repository/entities/user.entity';

export interface IRequestApp<T = IAuthJwtAccessTokenPayload> extends Request {
  user?: T;

  __id?: string;
  __user?: UserEntity;
  __language: string;
  __version: string;
  __userAgent?: string;

  __pagination?: ResponsePagingMetadataPaginationRequestDto;
}
