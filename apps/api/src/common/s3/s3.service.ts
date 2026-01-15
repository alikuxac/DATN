import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { S3_FOLDERS } from './s3.constant';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION') || 'auto';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('S3_ENDPOINT'); // Custom endpoint for B2/R2

    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    // Use custom public URL if provided, otherwise construct from endpoint or AWS default
    this.publicUrl = this.configService.get<string>('AWS_S3_PUBLIC_URL');

    if (!this.publicUrl) {
      if (endpoint) {
        // For S3-compatible storage (B2/R2), use endpoint + bucket
        this.publicUrl = `${endpoint}/${this.bucketName}`;
      } else {
        // For AWS S3, use standard format
        this.publicUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com`;
      }
    }

    // Configure S3 client with optional custom endpoint
    const clientConfig: any = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    // Add custom endpoint if provided (for Backblaze B2, Cloudflare R2, etc.)
    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = true; // Required for some S3-compatible services
    }

    this.s3Client = new S3Client(clientConfig);

    this.logger.log(`S3 Service initialized with bucket: ${this.bucketName}${endpoint ? ` (endpoint: ${endpoint})` : ''}`);
  }

  /**
   * Generate unique S3 key
   */
  generateKey(prefix: string, filename: string): string {
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    const ext = filename.split('.').pop();
    return `${prefix}/${timestamp}_${randomId}.${ext}`;
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      const fileUrl = `${this.publicUrl}/${key}`;
      this.logger.log(`File uploaded successfully: ${fileUrl}`);

      return fileUrl;
    } catch (error: any) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error: any) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Extract S3 key from URL
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.startsWith('/') ? pathname.substring(1) : pathname;
    } catch (error: any) {
      this.logger.warn(`Invalid URL format: ${url}`);
      return null;
    }
  }

  /**
   * Delete file by URL
   */
  async deleteFileByUrl(url: string): Promise<void> {
    const key = this.extractKeyFromUrl(url);
    if (!key) {
      throw new Error('Invalid S3 URL');
    }
    await this.deleteFile(key);
  }
}
