import "server-only";

import { fetchYahooChartData } from "./yahooSession";
import {
  chartSeriesFromDailyBars,
  getCacheEntry,
  getCachedIntraday,
  upsertSymbolEntry,
} from "./priceCache";
import { CHART_RANGES, type ChartRangeId, type ChartSeries } from "./chartData";
import { extractDailyBars } from "./prices";

function seriesFromYahooResult(
  symbol: string,
  rangeId: ChartRangeId,
  result: Record<string, unknown>
): ChartSeries | null {
  const timestamps: number[] = (result.timestamp as number[]) ?? [];
  const quote = (result.indicators as { quote?: Array<{ close?: (number | null)[] }> })
    ?.quote?.[0];
  const closes: (number | null)[] = quote?.close ?? [];

  const points: { t: number; v: number }[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const v = closes[i];
    if (v == null) continue;
    points.push({ t: timestamps[i] * 1000, v });
  }

  if (points.length < 2) return null;

  const first = points[0].v;
  const last = points[points.length - 1].v;
  const changePct = first ? ((last - first) / first) * 100 : 0;

  return {
    symbol: symbol.toUpperCase(),
    range: rangeId,
    points,
    changePct,
  };
}

export async function fetchChartSeries(
  symbol: string,
  rangeId: ChartRangeId
): Promise<ChartSeries | null> {
  const config = CHART_RANGES.find((r) => r.id === rangeId);
  if (!config) return null;

  const sym = symbol.toUpperCase();

  const cachedIntraday = await getCachedIntraday(sym, rangeId);
  if (cachedIntraday) {
    return {
      symbol: sym,
      range: rangeId,
      points: cachedIntraday.points,
      changePct: cachedIntraday.changePct,
    };
  }

  if (rangeId === "1mo" || rangeId === "1y" || rangeId === "5y") {
    const entry = await getCacheEntry(sym);
    if (entry?.dailyBars.length) {
      const fromBars = chartSeriesFromDailyBars(sym, rangeId, entry.dailyBars);
      if (fromBars) return fromBars;
    }
  }

  try {
    const data = (await fetchYahooChartData(sym, {
      range: config.yahooRange,
      interval: config.interval,
    })) as { chart?: { result?: Array<Record<string, unknown>> } };
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const series = seriesFromYahooResult(sym, rangeId, result);
    if (!series) return null;

    if (rangeId === "1d" || rangeId === "5d") {
      await upsertSymbolEntry(sym, {
        intraday: {
          rangeId,
          points: series.points,
          changePct: series.changePct,
          fetchedAt: new Date().toISOString(),
        },
      });
    } else if (config.interval === "1d" || config.interval === "1wk") {
      const dailyBars = extractDailyBars({
        timestamp: (result.timestamp as number[]) ?? [],
        indicators: result.indicators as {
          quote?: Array<{
            close?: (number | null)[];
            open?: (number | null)[];
            high?: (number | null)[];
            low?: (number | null)[];
            volume?: (number | null)[];
          }>;
        },
      });
      if (dailyBars.length) {
        await upsertSymbolEntry(sym, { dailyBars });
      }
    }

    return series;
  } catch {
    return null;
  }
}
