import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query
} from '@nestjs/common';
import { ShelterService } from '../services/shelter.service';
import { ShelterCreateRequestDto } from '../dtos/request/shelter.create.request.dto';
import { ShelterUpdateRequestDto } from '../dtos/request/shelter.update.request.dto';
import {
  AuthJwtAccessProtected,
  AuthJwtPayload
} from '@modules/auth/decorators/auth.jwt.decorator';
import {
  Response,
  ResponsePaging
} from '@common/response/decorators/response.decorator';
import {
  PaginationQuery
} from '@common/pagination/decorators/pagination.decorator';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import { PaginationService } from '@common/pagination/services/pagination.service';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';

import { Throttle } from '@nestjs/throttler';
import { PolicyAbilityProtected } from '@modules/policy/decorators/policy.decorator';
import { ENUM_POLICY_SUBJECT, ENUM_POLICY_ACTION, IResponsePaging } from '@repo/shared';
import { UserProtected } from '@modules/users/decorators/user.decorator';

@Controller({
  version: '1',
  path: '/shelter',
})
export class ShelterAdminController {
  constructor(
    private readonly shelterService: ShelterService,
    private readonly paginationService: PaginationService
  ) { }

  @ResponsePaging('shelter.list')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.SHELTER,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @Get('/list')
  async list(
    @PaginationQuery({
      defaultPerPage: 20,
      availableSearch: ['name', 'address', 'regionId'],
      availableOrderBy: ['createdAt', 'name', 'status'],
    })
    { _search, _limit, _offset, _order }: PaginationListDto,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('regionId') regionId?: string
  ): Promise<IResponsePaging> {
    let find: Record<string, any> = { ..._search };

    if (type) find.type = type;
    if (status) find.status = status;
    if (regionId) find.regionId = regionId;

    const shelters = await this.shelterService.findAll(find, {
      paging: { limit: _limit, offset: _offset },
      order: _order,
    });

    const total = await this.shelterService.getTotal(find);
    const totalPage = this.paginationService.totalPage(total, _limit);

    return {
      _pagination: { total, totalPage },
      data: shelters.map(s => this.shelterService.mapToResponse(s)),
    };
  }

  @Response('shelter.detail')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.SHELTER,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Get('/:id')
  async getById(@Param('id') id: string) {
    const shelter = await this.shelterService.findOneById(id);
    return this.shelterService.mapToResponse(shelter);
  }

  @Response('shelter.create')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.SHELTER,
    action: [ENUM_POLICY_ACTION.CREATE],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Post('/create')
  async create(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @Body() body: ShelterCreateRequestDto
  ) {
    const shelter = await this.shelterService.create(user, body);
    return this.shelterService.mapToResponse(shelter);
  }

  @Response('shelter.update')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.SHELTER,
    action: [ENUM_POLICY_ACTION.UPDATE],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() body: ShelterUpdateRequestDto
  ) {
    const shelter = await this.shelterService.update(id, body);
    return this.shelterService.mapToResponse(shelter);
  }

  @Response('shelter.updateResources')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.SHELTER,
    action: [ENUM_POLICY_ACTION.UPDATE],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Put('/:id/resources')
  async updateResources(
    @Param('id') id: string,
    @Body('resources') resources: Array<{ name: string; quantity: number; unit: string; category?: string }>
  ) {
    const shelter = await this.shelterService.updateResources(id, resources);
    return this.shelterService.mapToResponse(shelter);
  }

  @Response('shelter.updateOccupancy')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.SHELTER,
    action: [ENUM_POLICY_ACTION.UPDATE],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Put('/:id/occupancy')
  async updateOccupancy(
    @Param('id') id: string,
    @Body('currentOccupancy') currentOccupancy: number
  ) {
    const shelter = await this.shelterService.updateOccupancy(id, currentOccupancy);
    return this.shelterService.mapToResponse(shelter);
  }

  @Response('shelter.delete')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.SHELTER,
    action: [ENUM_POLICY_ACTION.DELETE],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Delete('/:id')
  async delete(@Param('id') id: string) {
    await this.shelterService.delete(id);
    return { success: true };
  }

  @Response('shelter.nearby')
  @PolicyAbilityProtected({
    subject: ENUM_POLICY_SUBJECT.SHELTER,
    action: [ENUM_POLICY_ACTION.READ],
  })
  @UserProtected()
  @AuthJwtAccessProtected()
  @Get('/nearby/search')
  async findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('maxDistance') maxDistance?: number,
    @Query('type') type?: string,
    @Query('status') status?: string
  ) {
    const filters: Record<string, any> = {};
    if (type) filters.type = type;
    if (status) filters.status = status;

    const shelters = await this.shelterService.findNearby(
      lat,
      lng,
      maxDistance || 10000,
      filters
    );

    return shelters.map(s => this.shelterService.mapToResponse(s));
  }
}
