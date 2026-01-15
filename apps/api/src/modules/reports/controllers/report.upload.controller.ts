import {
  Controller,
  Post,
  Delete,
  Body,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Multer } from 'multer';
import { S3Service } from '@common/s3/s3.service';
import { AuthJwtAccessProtected } from '@modules/auth/decorators/auth.jwt.decorator';
import { MAX_REPORT_IMAGE_SIZE, ALLOWED_IMAGE_TYPES, S3_FOLDERS, MAX_REPORT_IMAGES } from '@common/s3/s3.constant';
import { Response } from '@common/response/decorators/response.decorator';
import { IResponse } from '@common/response/interfaces/response.interface';

@ApiTags('reports.upload')
@Controller({
  version: '1',
  path: '/reports',
})
export class ReportUploadController {
  constructor(private readonly s3Service: S3Service) { }

  @Response('report.upload.images')
  @AuthJwtAccessProtected()
  @ApiBearerAuth('accessToken')
  @Post('/images/upload')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', MAX_REPORT_IMAGES))
  async uploadImages(
    @UploadedFiles() files: Multer.File[],
  ): Promise<IResponse<{ imageUrls: string[] }>> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    if (files.length > MAX_REPORT_IMAGES) {
      throw new BadRequestException(
        `Maximum ${MAX_REPORT_IMAGES} images allowed`,
      );
    }

    // Validate all files
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Invalid file type for ${file.originalname}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        );
      }

      if (file.size > MAX_REPORT_IMAGE_SIZE) {
        throw new BadRequestException(
          `File ${file.originalname} exceeds maximum allowed size of ${MAX_REPORT_IMAGE_SIZE / 1024 / 1024}MB`,
        );
      }
    }

    // Upload all files
    const uploadPromises = files.map((file, index) => {
      const key = this.s3Service.generateKey(
        S3_FOLDERS.REPORTS,
        `${Date.now()}_${index}_${file.originalname}`,
      );
      return this.s3Service.uploadFile(file.buffer, key, file.mimetype);
    });

    const imageUrls = await Promise.all(uploadPromises);

    return {
      data: { imageUrls },
    };
  }

  @Response('report.delete.images')
  @AuthJwtAccessProtected()
  @ApiBearerAuth('accessToken')
  @Delete('/images')
  @HttpCode(HttpStatus.OK)
  async deleteImages(
    @Body() body: { imageUrls: string[] },
  ): Promise<IResponse<{ message: string }>> {
    if (!body.imageUrls || body.imageUrls.length === 0) {
      throw new BadRequestException('No image URLs provided');
    }

    // Delete all images
    const deletePromises = body.imageUrls.map((url) =>
      this.s3Service.deleteFileByUrl(url).catch((error: any) => {
        console.warn(`Failed to delete image ${url}:`, error?.message);
      }),
    );

    await Promise.all(deletePromises);

    return {
      data: { message: 'Images deleted successfully' },
    };
  }
}
