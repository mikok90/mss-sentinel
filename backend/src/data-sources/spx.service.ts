import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface SpxResult {
  price: number;
  fiftyTwoWeekHigh: number;
  drawdownPct: number;
  source: 'YAHOO';
}

@Injectable()
export class SpxService {
  private readonly logger = new Logger(SpxService.name);

  async fetchSpx(): Promise<SpxResult> {
    try {
      const result = await this.fetchFromYahoo();
      this.logger.log(`SPX from Yahoo: ${result.price} (drawdown: ${result.drawdownPct.toFixed(1)}%)`);
      return result;
    } catch (err) {
      this.logger.error(`SPX fetch failed: ${err.message}`);
      throw new Error('SPX data source failed');
    }
  }

  private async fetchFromYahoo(): Promise<SpxResult> {
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC';
    const params = { interval: '1d', range: '5d' };
    const response = await axios.get(url, {
      params,
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const meta = response.data?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const fiftyTwoWeekHigh = meta?.fiftyTwoWeekHigh;

    if (!price || !fiftyTwoWeekHigh) {
      throw new Error('No Yahoo SPX price or 52w high');
    }

    const drawdownPct = ((fiftyTwoWeekHigh - price) / fiftyTwoWeekHigh) * 100;

    return {
      price: parseFloat(price.toFixed(2)),
      fiftyTwoWeekHigh: parseFloat(fiftyTwoWeekHigh.toFixed(2)),
      drawdownPct: parseFloat(drawdownPct.toFixed(2)),
      source: 'YAHOO',
    };
  }
}
