import { Body, Controller, Ip, Post } from '@nestjs/common';
import { GameService } from './game.service';

interface GuessSubmissionDto {
  code: string;
  wallet: string;
  captchaToken: string;
}

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('submit')
  async submitGuess(@Body() submission: GuessSubmissionDto, @Ip() ip: string) {
    return this.gameService.submitGuess(
      submission.code,
      submission.wallet,
      submission.captchaToken,
      ip,
    );
  }
}
