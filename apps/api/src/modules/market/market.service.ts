import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketData } from '../../entities/market.entity';
import { MarketGateway } from '../../gateways/market.gateway';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly MARKET_CAP_MILESTONE = 1_000_000; // 1M increments

  constructor(
    @InjectRepository(MarketData)
    private marketDataRepository: Repository<MarketData>,
    private marketGateway: MarketGateway,
    private configService: ConfigService,
  ) {}

  @Interval(30000) // Every 30 seconds
  async updateMarketData() {
    try {
      // TODO: Implement Helius API call to get market data
      const marketData = await this.fetchMarketData();

      // Save to database
      const savedData = await this.marketDataRepository.save(marketData);

      // Broadcast to connected clients
      this.marketGateway.broadcastMarketUpdate(savedData);

      // Check for milestones
      await this.checkMilestones(savedData.marketCap);
    } catch (error) {
      this.logger.error('Error updating market data:', error);
    }
  }

  private async fetchMarketData() {
    // TODO: Implement actual Helius API call
    // Placeholder for now
    return {
      marketCap: 0,
      price: 0,
      timestamp: new Date(),
    };
  }

  private async checkMilestones(currentMarketCap: number) {
    // TODO: Implement milestone checking logic
    // This will trigger character reveals when market cap hits milestones
  }
}
