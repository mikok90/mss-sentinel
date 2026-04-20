import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface VixResult {
  value: number;
  source: 'FRED' | 'YAHOO' | 'CACHE';
  date: string;
}

@Injectable()
export class VixService {
  private readonly logger = new Logger(VixService.name);
  private readonly fredApiKey = process.env.FRED_API_KEY;

  async fetchVix(): Promise<VixResult> {
    // Primary: Yahoo Finance (real-time, 15-min delay) — reflects intraday moves
    try {
      const result = await this.fetchFromYahoo();
      this.logger.log(`VIX from Yahoo: ${result.value}`);
      return result;
    } catch (err) {
      this.logger.warn(`Yahoo Finance failed: ${err.message} — trying FRED`);
    }

    // Fallback: FRED API (end-of-day only — previous close)
    try {
      const result = await this.fetchFromFred();
      this.logger.log(`VIX from FRED: ${result.value} (${result.date})`);
      return result;
    } catch (err) {
      this.logger.error(`FRED failed: ${err.message}`);
      throw new Error('All VIX data sources failed');
    }
  }

  private async fetchFromFred(): Promise<VixResult> {
    if (!this.fredApiKey) throw new Error('FRED_API_KEY not set');

    const url = 'https://api.stlouisfed.org/fred/series/observations';
    const params = {
      series_id: 'VIXCLS',
      api_key: this.fredApiKey,
      limit: 5,
      sort_order: 'desc',
      file_type: 'json',
    };

    const response = await axios.get(url, { params, timeout: 10000 });
    const observations = response.data?.observations;
    if (!observations?.length) throw new Error('No FRED observations');

    // FRED returns "." for missing values (market closed). Find the latest real value.
    const valid = observations.find((o: any) => o.value !== '.');
    if (!valid) throw new Error('No valid VIX value from FRED (market closed?)');

    return {
      value: parseFloat(valid.value),
      source: 'FRED',
      date: valid.date,
    };
  }

  private async fetchFromYahoo(): Promise<VixResult> {
    // Yahoo Finance chart API (15-min delay, free, no key needed)
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX';
    const params = { interval: '1d', range: '5d' };

    const response = await axios.get(url, {
      params,
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const result = response.data?.chart?.result?.[0];
    const price = result?.meta?.regularMarketPrice;
    if (!price) throw new Error('No Yahoo VIX price');

    return {
      value: parseFloat(price.toFixed(2)),
      source: 'YAHOO',
      date: new Date().toISOString().split('T')[0],
    };
  }
}
