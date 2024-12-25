import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface GameState {
  revealedCharacters: string[];
  currentMilestone: number;
  isActive: boolean;
}

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private readonly secretCode: string;
  private readonly REDIS_GAME_KEY = 'game:state';
  private readonly MARKET_CAP_MILESTONE = 1_000_000; // 1M $ milestone for each reveal

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private configService: ConfigService,
  ) {
    this.secretCode = this.configService.get<string>('SECRET_CODE');
    if (!this.secretCode) {
      this.logger.error('SECRET_CODE not found in environment variables');
      throw new Error('SECRET_CODE is required');
    }
  }

  private async getGameState(): Promise<GameState> {
    const state = await this.redis.get(this.REDIS_GAME_KEY);
    if (!state) {
      const initialState: GameState = {
        revealedCharacters: Array(this.secretCode.length).fill('_'),
        currentMilestone: 0,
        isActive: true,
      };
      await this.redis.set(this.REDIS_GAME_KEY, JSON.stringify(initialState));
      return initialState;
    }
    return JSON.parse(state);
  }

  private async saveGameState(state: GameState): Promise<void> {
    await this.redis.set(this.REDIS_GAME_KEY, JSON.stringify(state));
  }

  async handleMilestoneReached(marketCap: number): Promise<string | null> {
    const milestone = Math.floor(marketCap / this.MARKET_CAP_MILESTONE);
    const state = await this.getGameState();

    if (
      milestone > state.currentMilestone &&
      state.revealedCharacters.includes('_')
    ) {
      this.logger.debug(`New milestone reached: ${milestone}M`);
      state.currentMilestone = milestone;

      // Find the next unrevealed position
      const nextPosition = state.revealedCharacters.indexOf('_');

      if (nextPosition !== -1) {
        state.revealedCharacters[nextPosition] = this.secretCode[nextPosition];
        await this.saveGameState(state);

        return JSON.stringify({
          position: nextPosition,
          character: this.secretCode[nextPosition],
          revealedCharacters: state.revealedCharacters,
        });
      }
    }

    return null;
  }

  async getCurrentState(): Promise<GameState> {
    return this.getGameState();
  }

  async resetGame(): Promise<void> {
    const initialState: GameState = {
      revealedCharacters: Array(this.secretCode.length).fill('_'),
      currentMilestone: 0,
      isActive: true,
    };
    await this.saveGameState(initialState);
  }
}
