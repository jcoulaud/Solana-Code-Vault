import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

interface RaydiumPriceResponse {
  id: string;
  success: boolean;
  data: {
    [key: string]: string;
  };
}

interface MarketData {
  marketCap: number;
  price: number;
  formattedMarketCap: string;
  supply: number;
}

@Injectable()
export class PriceService {
  private readonly logger = new Logger(PriceService.name);
  private readonly connection: Connection;
  private readonly TOKEN_ADDRESS =
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'; // Temporary Bonk address for testing

  constructor(private configService: ConfigService) {
    this.connection = new Connection('https://api.mainnet-beta.solana.com');
  }

  private formatNumber(num: number): string {
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    }
    if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    }
    return `$${num.toFixed(2)}`;
  }

  async getTokenPrice(): Promise<number> {
    try {
      const response = await axios.get<RaydiumPriceResponse>(
        `https://api-v3.raydium.io/mint/price?mints=${this.TOKEN_ADDRESS}`,
      );

      if (response.data.success && response.data.data[this.TOKEN_ADDRESS]) {
        const price = parseFloat(response.data.data[this.TOKEN_ADDRESS]);
        this.logger.debug(`Current price: ${price}`);
        return price;
      }

      this.logger.warn('Token price not found in response');
      return 0;
    } catch (error) {
      this.logger.error('Error fetching token price:', error);
      return 0;
    }
  }

  async getCirculatingSupply(): Promise<number> {
    try {
      const tokenMint = new PublicKey(this.TOKEN_ADDRESS);
      const tokenSupply = await this.connection.getTokenSupply(tokenMint);
      const supply = Number(tokenSupply.value.uiAmount);
      this.logger.debug(`Current supply: ${supply}`);
      return supply;
    } catch (error) {
      this.logger.error('Error fetching circulating supply:', error);
      return 0;
    }
  }

  async getMarketCap(): Promise<MarketData> {
    const [price, supply] = await Promise.all([
      this.getTokenPrice(),
      this.getCirculatingSupply(),
    ]);

    const marketCap = price * supply;

    this.logger.debug(
      `Price: ${price}, Supply: ${supply}, Market Cap: ${marketCap}`,
    );

    return {
      marketCap,
      price,
      formattedMarketCap: this.formatNumber(marketCap),
      supply,
    };
  }
}
