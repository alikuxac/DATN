import { Controller, Get, Patch, Param } from '@nestjs/common';
import { Response } from '@common/response/decorators/response.decorator';
import { NotificationService } from './notification.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaginationService } from '@common/pagination/services/pagination.service';
import { PaginationListDto } from '@common/pagination/dtos/pagination.list.dto';
import { AuthJwtAccessProtected, AuthJwtPayload } from '@modules/auth/decorators/auth.jwt.decorator';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { PaginationQuery } from '@common/pagination/decorators/pagination.decorator';
import { ResponsePaging } from '@common/response/decorators/response.decorator';
import { ENUM_USER_ROLE } from '@repo/shared';

@ApiTags('modules.notifications')
@ApiBearerAuth('accessToken')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly paginationService: PaginationService
  ) { }

  @ResponsePaging('notification.list')
  @AuthJwtAccessProtected()
  @Get('/')
  async findAll(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @PaginationQuery({
      defaultPerPage: 20,
      availableSearch: ['title', 'body'],
      availableOrderBy: ['createdAt'],
    })
    { _search, _limit, _offset, _order }: PaginationListDto
  ) {
    const find: Record<string, any> = {
      ..._search,
    };

    let notifications;
    let total;

    if (user.role === ENUM_USER_ROLE.ADMIN || user.role === ENUM_USER_ROLE.SUPER_ADMIN) {
      notifications = await this.notificationService.findAll(find, {
        limit: _limit,
        skip: _offset,
        sort: _order,
      });
      total = await this.notificationService.getTotal(find);
    } else {
      notifications = await this.notificationService.findAllByUser(user._id.toString(), {
        limit: _limit,
        skip: _offset,
        sort: _order,
      });
      total = await this.notificationService.getTotalByUser(user._id.toString(), find);
    }

    const totalPage = this.paginationService.totalPage(
      total,
      _limit
    );

    return {
      _pagination: { total, totalPage },
      data: notifications,
    };
  }

  @Response('notification.unreadCount')
  @AuthJwtAccessProtected()
  @Get('unread-count')
  async getUnreadCount(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument
  ) {
    const count = await this.notificationService.countUnread(user._id.toString());
    return { data: { count } };
  }

  @Response('notification.markRead')
  @AuthJwtAccessProtected()
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    // TODO: check user ownership if strict security needed, but currently service just updates by ID. 
    // Ideally pass user to markAsRead for ownership check.
    return this.notificationService.markAsRead(id);
  }
}
