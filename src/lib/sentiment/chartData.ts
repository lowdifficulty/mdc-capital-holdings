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
