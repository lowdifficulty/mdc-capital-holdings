export interface Position {
  symbol: string;
  shares: number;
  avgCost: number;
  addedAt: string;
}

export interface PositionWithQuote extends Position {
  price?: number;
  dailyChange?: number;
  marketValue?: number;
  costBasis?: number;
  unrealizedPnL?: number;
  unrealizedPnLPct?: number;
}

export interface PositionsSummary {
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPct: number;
}

export interface PositionsReport {
  positions: PositionWithQuote[];
  summary: PositionsSummary;
  updatedAt: string;
}
