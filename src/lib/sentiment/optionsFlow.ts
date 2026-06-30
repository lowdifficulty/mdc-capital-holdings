import type { SentimentMention } from "./types";
import { labelFromScore } from "./lexicon";
import { fetchYahooJson } from "./yahooSession";

interface YahooOptionContract {
  volume?: number;
  openInterest?: number;
}

interface YahooOptionsExpiration {
  expirationDate: number;
  calls: YahooOptionContract[];
  puts: YahooOptionContract[];
}

interface YahooOptionsResponse {
  optionChain?: {
    result?: Array<{
      options?: YahooOptionsExpiration[];
    }>;
  };
}

function sumVolume(contracts: YahooOptionContract[]): number {
  return contracts.reduce((sum, c) => sum + (c.volume ?? 0), 0);
}

function putCallVolumeScore(callVolume: number, putVolume: number): number {
  const total = callVolume + putVolume;
  if (total <= 0) return 0;

  const ratio = putVolume / Math.max(callVolume, 1);
  // High put/call volume ratio → bearish positioning; low ratio → bullish.
  if (ratio >= 2) return -0.75;
  if (ratio >= 1.4) return -0.45;
  if (ratio >= 1.15) return -0.2;
  if (ratio <= 0.45) return 0.75;
  if (ratio <= 0.7) return 0.45;
  if (ratio <= 0.9) return 0.2;
  return (1 - ratio) * 0.35;
}

/** Options put/call volume ratio from Yahoo Finance (nearest expiration). */
export async function fetchOptionsFlow(symbol: string): Promise<SentimentMention[]> {
  const ticker = symbol.toUpperCase();
  const url = `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(ticker)}`;

  const data = await fetchYahooJson<YahooOptionsResponse>(url);
  const expirations = data?.optionChain?.result?.[0]?.options;
  if (!expirations?.length) return [];

  const nearest = expirations[0];
  const callVolume = sumVolume(nearest.calls ?? []);
  const putVolume = sumVolume(nearest.puts ?? []);
  const totalVolume = callVolume + putVolume;
  if (totalVolume <= 0) return [];

  const ratio = putVolume / Math.max(callVolume, 1);
  const score = putCallVolumeScore(callVolume, putVolume);
  const expDate = new Date(nearest.expirationDate * 1000).toISOString();

  return [
    {
      id: `options_flow-${ticker}-${nearest.expirationDate}`,
      source: "options_flow" as const,
      title: `${ticker} options flow — P/C volume ${ratio.toFixed(2)}`,
      summary: `Nearest expiry: ${callVolume.toLocaleString()} call vol vs ${putVolume.toLocaleString()} put vol (${totalVolume.toLocaleString()} total). Ratio >1 suggests hedging/bearish flow; <1 suggests bullish flow.`,
      publishedAt: expDate,
      score,
      label: labelFromScore(score),
      meta: {
        callVolume,
        putVolume,
        putCallRatio: Math.round(ratio * 100) / 100,
        expirationDate: nearest.expirationDate,
      },
    },
  ];
}
