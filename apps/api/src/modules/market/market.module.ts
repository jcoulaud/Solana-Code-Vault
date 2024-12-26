import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketData } from '../../entities/market.entity';
import { GatewayModule } from '../../gateways/gateway.module';
import { GameModule } from '../game/game.module';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { PriceService } from './services/price.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketData]),
    ScheduleModule.forRoot(),
    GameModule,
    GatewayModule,
  ],
  controllers: [MarketController],
  providers: [MarketService, PriceService],
  exports: [MarketService],
})
export class MarketModule {}
