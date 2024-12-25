import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketData } from '../../entities/market.entity';
import { MarketGateway } from '../../gateways/market.gateway';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { PriceService } from './services/price.service';

@Module({
  imports: [TypeOrmModule.forFeature([MarketData]), ScheduleModule.forRoot()],
  controllers: [MarketController],
  providers: [MarketService, PriceService, MarketGateway],
  exports: [MarketService],
})
export class MarketModule {}
