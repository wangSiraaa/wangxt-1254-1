import { Module, Global } from '@nestjs/common';
import { RedisLockService } from './services/redis-lock.service';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const Redis = require('ioredis');
        return new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD') || undefined,
          db: configService.get<number>('REDIS_DB', 0),
        });
      },
      inject: [ConfigService],
    },
    RedisLockService,
  ],
  exports: [RedisLockService, 'REDIS_CLIENT'],
})
export class CommonModule {}
