import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketData } from '../../entities/market.entity';
import { MarketGateway } from '../../gateways/market.gateway';
import { GameService } from '../game/game.service';
import { PriceService } from './services/price.service';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);

  constructor(
    @InjectRepository(MarketData)
    private marketDataRepository: Repository<MarketData>,
    private marketGateway: MarketGateway,
    private priceService: PriceService,
    private gameService: GameService,
  ) {}

  async getLatestMarketData() {
    const data = await this.priceService.getMarketCap();
    const savedData = await this.marketDataRepository.save({
      marketCap: data.marketCap,
      price: data.price,
      createdAt: new Date(),
    });

    const gameState = await this.gameService.getCurrentState();

    await this.gameService.handleMilestoneReached(data.marketCap);

    return {
      marketCap: savedData.marketCap,
      revealedCharacters: gameState.revealedCharacters,
      winners: gameState.winners,
      lastUpdate: savedData.createdAt.toISOString(),
    };
  }

  @Interval(10000)
  async updateMarketData() {
    try {
      const marketData = await this.getLatestMarketData();
      this.marketGateway.broadcastMarketUpdate(marketData);
    } catch (error) {
      this.logger.error('Error updating market data:', error);
    }
  }
}
