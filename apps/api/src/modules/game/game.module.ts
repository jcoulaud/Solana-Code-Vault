import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GameService } from './game.service';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        options: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          db: 1,
          keyPrefix: 'codevault:',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
