import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
} from '@nestjs/common';
import { GameService } from '../game/game.service';
import { MarketService } from './market.service';

class SubmitCodeDto {
  code: string;
  captchaToken: string;
  walletAddress: string;
}

@Controller('market')
export class MarketController {
  constructor(
    private readonly marketService: MarketService,
    private readonly gameService: GameService,
  ) {}

  @Get('state')
  async getState() {
    return this.marketService.getLatestMarketData();
  }

  @Post('submit')
  async submitCode(@Body() body: SubmitCodeDto, @Req() request) {
    const { code, captchaToken, walletAddress } = body;

    if (!code || code.length !== 100) {
      throw new BadRequestException('Code must be exactly 100 characters long');
    }

    if (!walletAddress) {
      throw new BadRequestException('Wallet address is required');
    }

    if (!captchaToken) {
      throw new BadRequestException('CAPTCHA token is required');
    }

    try {
      return await this.gameService.submitGuess(
        code,
        walletAddress,
        captchaToken,
        request.ip,
      );
    } catch (error) {
      if (error.message.includes('CAPTCHA')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
