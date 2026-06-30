const UA = "MDC-Capital-Sentiment/1.0";

export type ChartRangeId = "1d" | "5d" | "1mo" | "1y" | "5y";

export interface ChartRangeConfig {
  id: ChartRangeId;
  label: string;
  yahooRange: string;
  interval: string;
}

export const CHART_RANGES: ChartRangeConfig[] = [
  { id: "1d", label: "24 hr", yahooRange: "1d", interval: "15m" },
  { id: "5d", label: "7D", yahooRange: "5d", interval: "1h" },
  { id: "1mo", label: "30D", yahooRange: "1mo", interval: "1d" },
  { id: "1y", label: "1Y", yahooRange: "1y", interval: "1d" },
  { id: "5y", label: "Max", yahooRange: "5y", interval: "1wk" },
];

export interface ChartPoint {
  t: number;
  v: number;
}

export interface ChartSeries {
  symbol: string;
  range: ChartRangeId;
  points: ChartPoint[];
  changePct: number;
}

export async function fetchChartSeries(
  symbol: string,
  rangeId: ChartRangeId
): Promise<ChartSeries | null> {
  const config = CHART_RANGES.find((r) => r.id === rangeId);
  if (!config) return null;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${config.yahooRange}&interval=${config.interval}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    const points: ChartPoint[] = [];
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
  } catch {
    return null;
  }
}
