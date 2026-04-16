import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface FngResult {
  value: number;
  rating: string;
  source: 'CNN' | 'CACHE';
}

@Injectable()
export class FngService {
  private readonly logger = new Logger(FngService.name);

  async fetchFng(): Promise<FngResult> {
    // Primary: CNN Fear & Greed unofficial API
    try {
      const result = await this.fetchFromCnn();
      this.logger.log(`F&G from CNN: ${result.value} (${result.rating})`);
      return result;
    } catch (err) {
      this.logger.error(`CNN F&G failed: ${err.message}`);
      throw new Error('Fear & Greed data source failed');
    }
  }

  private async fetchFromCnn(): Promise<FngResult> {
    const url = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata';

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
        'Referer': 'https://edition.cnn.com/',
      },
    });

    const fg = response.data?.fear_and_greed;
    if (!fg?.score && fg?.score !== 0) throw new Error('No F&G score in CNN response');

    return {
      value: Math.round(fg.score),
      rating: fg.rating || '',
      source: 'CNN',
    };
  }
}
