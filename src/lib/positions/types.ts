export interface Position {
  symbol: string;
  shares: number;
  avgCost: number;
  addedAt: string;
}

export interface RealizedTrade {
  symbol: string;
  shares: number;
  buyPrice: number;
  sellPrice: number;
  realizedPnL: number;
  tradeDate: string;
  account: "fidelity" | "trading";
}

export interface PositionWithQuote extends Position {
  price?: number;
  dailyChange?: number;
  marketValue?: number;
  costBasis?: number;
  unrealizedPnL?: number;
  unrealizedPnLPct?: number;
  dailyPnL?: number;
  dailyPnLPct?: number;
}

export interface PositionsSummary {
  totalMarketValue: number;
  totalCostBasis: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPct: number;
  totalDailyPnL: number;
  totalDailyPnLPct: number;
  cashBalance: number;
  cashFidelity: number;
  cashTrading: number;
  totalPortfolioValue: number;
}

export interface PositionsReport {
  positions: PositionWithQuote[];
  realizedTrades?: RealizedTrade[];
  summary: PositionsSummary;
  updatedAt: string;
}
