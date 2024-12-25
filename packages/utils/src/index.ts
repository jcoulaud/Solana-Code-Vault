export interface MarketData {
  marketCap: number;
  price: number;
  volume24h: number;
}

export interface GameState {
  currentMilestone: number;
  revealedCharacters: string[];
  winnersCount: number;
  isGameActive: boolean;
}
