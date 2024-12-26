import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import Redis from 'ioredis';

interface GameState {
  revealedCharacters: string[];
  currentMilestone: number;
  isActive: boolean;
}

const HIDDEN_CHARS = 5; // Last 5 chars hidden until final milestone to prevent bruteforce
const FINAL_MILESTONE = 100_000_000; // $100M for final reveal
const RATE_LIMIT_WINDOW = 2000; // 2 seconds between attempts
const MAX_ATTEMPTS_PER_WALLET = 5; // Limit total attempts per wallet

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

    // If final milestone reached, reveal all remaining characters
    if (marketCap >= FINAL_MILESTONE) {
      return this.revealAllCharacters(state);
    }

    // Otherwise reveal up to length - HIDDEN_CHARS
    if (
      milestone > state.currentMilestone &&
      state.revealedCharacters.includes('_') &&
      this.getRevealedCount(state) < this.secretCode.length - HIDDEN_CHARS
    ) {
      this.logger.debug(`New milestone reached: ${milestone}M`);
      state.currentMilestone = milestone;

      const nextPosition = state.revealedCharacters.indexOf('_');
      if (nextPosition !== -1) {
        state.revealedCharacters[nextPosition] = this.secretCode[nextPosition];
        await this.saveGameState(state);

        return JSON.stringify({
          position: nextPosition,
          character: this.secretCode[nextPosition],
          revealedCharacters: state.revealedCharacters,
          remainingHidden: HIDDEN_CHARS,
        });
      }
    }

    return null;
  }

  private getRevealedCount(state: GameState): number {
    return state.revealedCharacters.filter((char) => char !== '_').length;
  }

  private async revealAllCharacters(state: GameState): Promise<string> {
    for (let i = 0; i < this.secretCode.length; i++) {
      if (state.revealedCharacters[i] === '_') {
        state.revealedCharacters[i] = this.secretCode[i];
      }
    }
    await this.saveGameState(state);

    return JSON.stringify({
      allRevealed: true,
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

  async submitGuess(
    code: string,
    wallet: string,
    captchaToken: string,
    ip: string,
  ): Promise<boolean> {
    // Check rate limit
    await this.checkRateLimit(ip);

    // Verify CAPTCHA
    const isCaptchaValid = await this.verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      throw new Error('Invalid CAPTCHA');
    }

    // Check wallet attempt count
    const attempts = await this.getWalletAttempts(wallet);
    if (attempts >= MAX_ATTEMPTS_PER_WALLET) {
      throw new Error('Maximum attempts exceeded for this wallet');
    }

    // Increment attempt counter before checking code
    await this.incrementWalletAttempts(wallet);

    // Check if code matches
    return code === this.secretCode;
  }

  private async verifyCaptcha(token: string): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        {
          secret: this.configService.get('RECAPTCHA_SECRET_KEY'),
          token,
        },
      );
      return response.data.success;
    } catch (error) {
      this.logger.error('CAPTCHA verification failed:', error);
      return false;
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

  async getCurrentState(): Promise<GameState> {
    return this.getGameState();
  }
}
