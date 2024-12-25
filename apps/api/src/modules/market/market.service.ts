import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketData } from '../../entities/market.entity';
import { MarketGateway } from '../../gateways/market.gateway';
import { PriceService } from './services/price.service';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly MARKET_CAP_MILESTONE = 1_000_000; // 1M increments
  private lastMilestone = 0;

  constructor(
    @InjectRepository(MarketData)
    private marketDataRepository: Repository<MarketData>,
    private marketGateway: MarketGateway,
    private priceService: PriceService,
  ) {}

  async getLatestMarketData() {
    // Get real-time data from price service
    const data = await this.priceService.getMarketCap();

    // Save to database
    const savedData = await this.marketDataRepository.save({
      marketCap: data.marketCap,
      price: data.price,
    });

    return savedData;
  }

  @Interval(30000) // Every 30 seconds
  async updateMarketData() {
    try {
      const marketData = await this.getLatestMarketData();

      // Broadcast to connected clients
      this.marketGateway.broadcastMarketUpdate(marketData);

      // Check for milestones
      await this.checkMilestones(marketData.marketCap);
    } catch (error) {
      this.logger.error('Error updating market data:', error);
    }
  }

  private async checkMilestones(currentMarketCap: number) {
    const currentMilestone = Math.floor(
      currentMarketCap / this.MARKET_CAP_MILESTONE,
    );

    if (currentMilestone > this.lastMilestone) {
      this.logger.log(`New milestone reached: ${currentMilestone}M`);
      // TODO: Trigger character reveal
      this.lastMilestone = currentMilestone;
    }
  }
}
