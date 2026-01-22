import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get<string>('redis.cached.host'),
      port: this.configService.get<number>('redis.cached.port'),
      username: this.configService.get<string>('redis.cached.username'),
      password: this.configService.get<string>('redis.cached.password'),
    });
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.quit();
    }
  }

  get client(): Redis {
    return this.redisClient;
  }
}
