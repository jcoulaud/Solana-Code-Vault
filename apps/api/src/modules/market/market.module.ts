import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketData } from '../../entities/market.entity';
import { MarketGateway } from '../../gateways/market.gateway';
import { MarketService } from './market.service';

@Module({
  imports: [TypeOrmModule.forFeature([MarketData]), ScheduleModule.forRoot()],
  providers: [MarketService, MarketGateway],
  exports: [MarketService],
})
export class MarketModule {}
