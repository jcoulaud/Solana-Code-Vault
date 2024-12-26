import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { Winner } from '../../entities/winner.entity';
import { MarketGateway } from '../../gateways/market.gateway';

interface GameState {
  revealedCharacters: string[];
  currentMilestone: number;
  isActive: boolean;
}

const HIDDEN_CHARS = 10; // Last 10 chars hidden until final milestone
const FINAL_MILESTONE = 100_000_000; // $100M for final reveal
const RATE_LIMIT_WINDOW = 2000; // 2 seconds between attempts
const MAX_ATTEMPTS_PER_WALLET = 5; // Limit total attempts per wallet
const MAX_WINNERS = 100;
const TOTAL_SUPPLY = 1_000_000_000; // 1B total supply
const PRIZE_POOL = TOTAL_SUPPLY * 0.1; // 10% of total supply for prize pool

// Reward percentages based on claimed position
const REWARD_PERCENTAGES = {
  1: 10, // 10% for 1st
  2: 7, // 7% for 2nd
  3: 5, // 5% for 3rd
  10: 2, // 2% for 4th-10th
  30: 1, // 1% for 11th-30th
  100: 0.63, // 0.63% for 31st-100th
};

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);
  private readonly secretCode: string;
  private readonly REDIS_GAME_KEY = 'game:state';
  private readonly MARKET_CAP_MILESTONE = 1_000_000; // 1M $ milestone for each reveal

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectRepository(Winner) private winnerRepository: Repository<Winner>,
    private marketGateway: MarketGateway,
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
        revealedCharacters: Array(this.secretCode.length).fill(''),
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

  async handleMilestoneReached(marketCap: number): Promise<void> {
    if (marketCap >= FINAL_MILESTONE) {
      const state = await this.getGameState();
      if (state.revealedCharacters.some((char) => char === '')) {
        await this.revealAllCharacters(state);
      }
      return;
    }

    const milestone = Math.floor(marketCap / this.MARKET_CAP_MILESTONE);
    const state = await this.getGameState();

    if (
      milestone > state.currentMilestone &&
      state.revealedCharacters.some((char) => char === '') &&
      this.getRevealedCount(state) < this.secretCode.length - HIDDEN_CHARS
    ) {
      this.logger.debug(`New milestone reached: ${milestone}M`);
      state.currentMilestone = milestone;

      const nextPosition = state.revealedCharacters.findIndex(
        (char) => char === '',
      );
      if (nextPosition !== -1) {
        state.revealedCharacters[nextPosition] = this.secretCode[nextPosition];
        await this.saveGameState(state);

        this.marketGateway.broadcastCharacterReveal({
          position: nextPosition,
          character: this.secretCode[nextPosition],
          revealedCharacters: state.revealedCharacters,
        });
      }
    }
  }

  private getRevealedCount(state: GameState): number {
    return state.revealedCharacters.filter((char) => char !== '').length;
  }

  private async revealAllCharacters(state: GameState): Promise<void> {
    for (let i = 0; i < this.secretCode.length; i++) {
      if (state.revealedCharacters[i] === '') {
        state.revealedCharacters[i] = this.secretCode[i];
      }
    }
    await this.saveGameState(state);

    this.marketGateway.broadcastCharacterReveal({
      revealedCharacters: state.revealedCharacters,
    });
  }

  private async checkRateLimit(ip: string): Promise<boolean> {
    const key = `ratelimit:${ip}`;
    const lastAttempt = await this.redis.get(key);

    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
      if (timeSinceLastAttempt < RATE_LIMIT_WINDOW) {
        throw new Error('Rate limit exceeded');
      }
    }

    await this.redis.set(key, Date.now().toString(), 'EX', 2);
    return true;
  }

  private getRewardPercentage(position: number): number {
    if (position === 1) return REWARD_PERCENTAGES[1];
    if (position === 2) return REWARD_PERCENTAGES[2];
    if (position === 3) return REWARD_PERCENTAGES[3];
    if (position <= 10) return REWARD_PERCENTAGES[10];
    if (position <= 30) return REWARD_PERCENTAGES[30];
    return REWARD_PERCENTAGES[100];
  }

  async submitGuess(
    code: string,
    wallet: string,
    captchaToken: string,
    ip: string,
  ): Promise<{ success: boolean; position?: number; reward?: number }> {
    // Check rate limit
    await this.checkRateLimit(ip);

    // Verify CAPTCHA
    const isCaptchaValid = await this.verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      throw new HttpException('Invalid CAPTCHA', HttpStatus.BAD_REQUEST);
    }

    // Check wallet attempt count
    const attempts = await this.getWalletAttempts(wallet);
    if (attempts >= MAX_ATTEMPTS_PER_WALLET) {
      throw new HttpException(
        'Maximum attempts exceeded for this wallet',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check if wallet already won
    const existingWinner = await this.winnerRepository.findOne({
      where: { walletAddress: wallet },
    });
    if (existingWinner) {
      throw new HttpException('Wallet has already won', HttpStatus.CONFLICT);
    }

    // Increment attempt counter before checking code
    await this.incrementWalletAttempts(wallet);

    // Check if code matches
    if (code !== this.secretCode) {
      return { success: false };
    }

    // Check if we still accept winners
    const winnerCount = await this.winnerRepository.count();
    if (winnerCount >= MAX_WINNERS) {
      throw new Error('Maximum winners reached');
    }

    // Create winner entry
    const position = winnerCount + 1;
    const rewardPercentage = Number(this.getRewardPercentage(position));
    const tokenAmount = Math.floor(PRIZE_POOL * (rewardPercentage / 100));

    const winner = this.winnerRepository.create({
      walletAddress: wallet,
      position,
      rewardPercentage,
      tokenAmount,
    });

    await this.winnerRepository.save(winner);

    // Get updated winners list
    const winners = await this.winnerRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Broadcast new winner with complete list
    this.marketGateway.broadcastWinner(winners);

    return {
      success: true,
      position,
      reward: rewardPercentage,
    };
  }

  private async verifyCaptcha(token: string): Promise<boolean> {
    try {
      const secretKey = this.configService.get('RECAPTCHA_SECRET_KEY');
      if (!secretKey) {
        this.logger.error(
          'RECAPTCHA_SECRET_KEY not found in environment variables',
        );
        throw new Error('CAPTCHA verification is not properly configured');
      }

      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        {
          params: {
            secret: secretKey,
            response: token,
          },
        },
      );

      if (!response.data.success) {
        this.logger.warn(
          'CAPTCHA verification failed:',
          response.data['error-codes'],
        );
        throw new Error(
          response.data['error-codes']?.[0] === 'invalid-input-response'
            ? 'Invalid CAPTCHA response. Please try again.'
            : 'CAPTCHA verification failed. Please try again.',
        );
      }

      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          'CAPTCHA verification request failed:',
          error.response?.data || error.message,
        );
        throw new Error('CAPTCHA verification failed. Please try again.');
      }
      throw error;
    }
  }

  private async getWalletAttempts(wallet: string): Promise<number> {
    const key = `attempts:${wallet}`;
    const attempts = await this.redis.get(key);
    return attempts ? parseInt(attempts) : 0;
  }

  private async incrementWalletAttempts(wallet: string): Promise<void> {
    const key = `attempts:${wallet}`;
    await this.redis.incr(key);
  }

  async getCurrentState(): Promise<{
    revealedCharacters: string;
    winners: Winner[];
  }> {
    const state = await this.getGameState();
    const winners = await this.winnerRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      revealedCharacters: state.revealedCharacters.join(''),
      winners,
    };
  }
}
