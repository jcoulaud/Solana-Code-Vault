export interface MarketState {
  marketCap: number;
  revealedCharacters: string;
  winners: Winner[];
  lastUpdate: string;
}

export interface Winner {
  address: string;
  timestamp: string;
  prize: number;
  tokens: number;
}

export interface MarketUpdate {
  type: 'MARKET_UPDATE' | 'WINNER_UPDATE' | 'CHARACTER_REVEAL';
  data: Partial<MarketState>;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  revealedCharacter?: string;
}
