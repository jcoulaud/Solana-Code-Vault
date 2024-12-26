export interface MarketState {
  marketCap: number;
  revealedCharacters: string;
  winners: Winner[];
  lastUpdate: string;
}

export interface MarketUpdate {
  type: 'MARKET_UPDATE' | 'WINNER_UPDATE' | 'CHARACTER_REVEAL';
  data: Partial<MarketState>;
}

export interface Winner {
  position: number;
  walletAddress: string;
  rewardPercentage: number;
  tokenAmount: number;
}

export interface SubmissionResponse {
  success: boolean;
  position?: number;
  reward?: number;
  message?: string;
}
