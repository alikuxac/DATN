import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Multer } from 'multer';
import { S3Service } from '@common/s3/s3.service';
import { AuthJwtAccessProtected, AuthJwtPayload } from '@modules/auth/decorators/auth.jwt.decorator';
import { UserDocument } from '@modules/users/repository/entities/user.entity';
import { UsersService } from '@modules/users/services/users.service';
import { UserParsePipe } from '@modules/users/pipes/user.parse.pipe';
import { MAX_AVATAR_SIZE, ALLOWED_IMAGE_TYPES, S3_FOLDERS } from '@common/s3/s3.constant';
import { Response } from '@common/response/decorators/response.decorator';
import { IResponse } from '@common/response/interfaces/response.interface';
import { UserProtected } from '@modules/users/decorators/user.decorator';


@ApiTags('users.upload')
@Controller({
  version: '1',
  path: '/users',
})
export class UserUploadController {
  constructor(
    private readonly s3Service: S3Service,
    private readonly usersService: UsersService,
  ) { }


  @Response('user.upload.avatar')
  @UserProtected([false])
  @AuthJwtAccessProtected()
  @ApiBearerAuth('accessToken')
  @HttpCode(HttpStatus.OK)
  @Post('/avatar/upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @AuthJwtPayload('user', UserParsePipe) user: UserDocument,
    @UploadedFile() file: Multer.File,
  ): Promise<IResponse<{ avatarUrl: string }>> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
      );
    }

    // Delete old avatar if exists
    if (user.avatar) {
      try {
        await this.s3Service.deleteFileByUrl(user.avatar);
      } catch (error: any) {
        // Log but don't fail if old avatar deletion fails
        console.warn('Failed to delete old avatar:', error?.message);
      }
    }

    // Generate S3 key
    const key = this.s3Service.generateKey(
      `${S3_FOLDERS.AVATARS}/${user._id}`,
      file.originalname,
    );

    // Upload to S3
    const avatarUrl = await this.s3Service.uploadFile(
      file.buffer,
      key,
      file.mimetype,
    );

    // Update user avatar
    await this.usersService.updateAvatar(user, avatarUrl);

    return {
      data: { avatarUrl },
    };
  }

  @Response('user.delete.avatar')
  @UserProtected([false])
  @AuthJwtAccessProtected()
  @ApiBearerAuth('accessToken')
  @HttpCode(HttpStatus.OK)
  @Delete('/avatar')
  async deleteAvatar(@AuthJwtPayload('user', UserParsePipe) user: UserDocument): Promise<IResponse<{ message: string }>> {
    if (!user.avatar) {
      throw new BadRequestException('No avatar to delete');
    }

    // Delete from S3
    await this.s3Service.deleteFileByUrl(user.avatar);

    // Update user
    await this.usersService.updateAvatar(user, null);

    return {
      data: { message: 'Avatar deleted successfully' },
    };
  }
}
