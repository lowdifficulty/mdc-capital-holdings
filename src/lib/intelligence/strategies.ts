import type { SentimentSnapshot, StrategyMatch, TechnicalSnapshot } from "./types";

function match(
  id: string,
  name: string,
  bias: StrategyMatch["bias"],
  strength: number,
  description: string
): StrategyMatch {
  return { id, name, bias, strength: Math.max(0, Math.min(100, strength)), description };
}

export function runStrategies(
  tech: TechnicalSnapshot,
  sentiment: SentimentSnapshot,
  symbol: string
): StrategyMatch[] {
  const out: StrategyMatch[] = [];
  const { price, vwap, ema9, ema20, sma50, sma200, rsi14, bollinger, atr14 } = tech;
  const sentPos = sentiment.scoreWeek > 15;
  const sentNeg = sentiment.scoreWeek < -15;
  const sentImproving = sentiment.velocity > 5;

  // 1. Opening Range Breakout
  if (price > tech.openingRangeHigh && tech.relativeVolume >= 1.2) {
    out.push(match("opening_range_breakout", "Opening Range Breakout", "bullish", 75,
      "Price broke above opening range high with elevated volume."));
  }
  if (price < tech.openingRangeLow && tech.relativeVolume >= 1.2) {
    out.push(match("opening_range_breakout", "Opening Range Breakout", "bearish", 75,
      "Price broke below opening range low with elevated volume."));
  }

  // 2. VWAP Reversion
  const vwapDist = ((price - vwap) / vwap) * 100;
  if (vwapDist < -1.5 && sentImproving) {
    out.push(match("vwap_reversion", "VWAP Reversion", "bullish", 65,
      "Price stretched below VWAP while sentiment is improving."));
  }
  if (vwapDist > 2 && sentNeg) {
    out.push(match("vwap_reversion", "VWAP Reversion", "bearish", 65,
      "Price extended above VWAP with weakening sentiment."));
  }

  // 3. VWAP Trend Follow
  if (price > vwap && ema9 > ema20 && sentPos) {
    out.push(match("vwap_trend", "VWAP Trend Follow", "bullish", 70,
      "Price above VWAP with bullish EMA stack and positive sentiment."));
  }
  if (price < vwap && ema9 < ema20 && sentNeg) {
    out.push(match("vwap_trend", "VWAP Trend Follow", "bearish", 70,
      "Price below VWAP with bearish EMA stack and negative sentiment."));
  }

  // 4. Moving Average Crossover
  if (ema9 > ema20 && price > sma50) {
    const strength = sma50 > sma200 ? 80 : 65;
    out.push(match("ma_crossover", "Moving Average Crossover", "bullish", strength,
      sma50 > sma200 ? "Golden cross structure: EMA9>EMA20, price>SMA50>SMA200." : "EMA9 above EMA20 with price above SMA50."));
  }
  if (ema9 < ema20 && price < sma50) {
    out.push(match("ma_crossover", "Moving Average Crossover", "bearish", 70,
      "EMA9 below EMA20 with price below SMA50."));
  }

  // 5. RSI Mean Reversion
  if (rsi14 < 30 && sentImproving) {
    out.push(match("rsi_reversion", "RSI Mean Reversion", "bullish", 60,
      "RSI oversold with stabilizing/improving sentiment."));
  }
  if (rsi14 > 75 && !sentPos) {
    out.push(match("rsi_reversion", "RSI Mean Reversion", "bearish", 55,
      "RSI overextended without strong sentiment support."));
  }

  // 6. Bollinger Band Reversion
  if (price <= bollinger.lower && sentiment.scoreWeek > 0) {
    out.push(match("bollinger_reversion", "Bollinger Band Reversion", "bullish", 62,
      "Price at/below lower Bollinger band with positive sentiment."));
  }
  if (price >= bollinger.upper && sentNeg) {
    out.push(match("bollinger_reversion", "Bollinger Band Reversion", "bearish", 62,
      "Price at/above upper Bollinger band with weakening sentiment."));
  }

  // 7. Momentum Ranking
  const mom = tech.return5d + tech.return20d * 0.5;
  if (mom > 5 && sentPos) {
    out.push(match("momentum_ranking", "Momentum Ranking", "bullish", 68,
      `Strong 5d/20d momentum (${tech.return5d.toFixed(1)}% / ${tech.return20d.toFixed(1)}%) with positive sentiment.`));
  }
  if (mom < -5 && sentNeg) {
    out.push(match("momentum_ranking", "Momentum Ranking", "bearish", 68,
      "Negative momentum with bearish sentiment."));
  }

  // 8. Gap-and-Go
  if (tech.premarketGapPct > 1 && price > vwap && price > tech.openingRangeHigh && tech.relativeVolume >= 1.5) {
    out.push(match("gap_and_go", "Gap-and-Go", "bullish", 78,
      "Gap up held above VWAP and broke premarket/or high on strong volume."));
  }

  // 9. Gap Fade
  if (tech.premarketGapPct > 1.5 && price < vwap) {
    out.push(match("gap_fade", "Gap Fade", "bearish", 65,
      "Gap up failed to hold VWAP — fade risk."));
  }
  if (tech.premarketGapPct < -1.5 && sentImproving && price > tech.openingRangeLow) {
    out.push(match("gap_fade", "Gap Fade", "bullish", 58,
      "Gap down reversing with improving sentiment."));
  }

  // 10. ATR Volatility Breakout
  const priorHigh = price - atr14;
  if (price > priorHigh + atr14 * 0.5 && tech.relativeVolume >= 1.2) {
    out.push(match("atr_breakout", "ATR Volatility Breakout", "bullish", 64,
      "Price broke prior range by meaningful ATR threshold."));
  }
  if (atr14 / price > 0.05) {
    out.push(match("atr_breakout", "ATR Volatility Breakout", "watch", 40,
      "ATR elevated relative to price — widen stops or avoid."));
  }

  // 11. Index ETF Pullback
  if (["SPY", "QQQ", "IWM"].includes(symbol) && price > sma50 && rsi14 < 55 && rsi14 > 35 && sentiment.scoreWeek >= -10) {
    out.push(match("index_pullback", "Index ETF Pullback Buying", "bullish", 60,
      "Index ETF pullback within uptrend with neutral-positive sentiment."));
  }

  // 12. News/Sentiment Momentum
  if (sentiment.velocity > 10 && tech.return1d > 0 && tech.relativeVolume >= 1.1) {
    out.push(match("sentiment_momentum", "News/Sentiment Momentum", "bullish", 72,
      "Sentiment accelerating with price/volume confirmation."));
  }
  if (tech.return5d > 3 && sentiment.velocity < -8) {
    out.push(match("sentiment_momentum", "News/Sentiment Momentum", "bearish", 70,
      "Price rising but sentiment deteriorating — divergence warning."));
  }

  // 13. Trailing Stop Trend
  if (price > ema20 && ema9 > ema20 && tech.return20d > 5) {
    out.push(match("trailing_stop", "Trailing Stop Trend", "bullish", 66,
      `Strong trend — consider ${(atr14 * 1.5).toFixed(2)} trailing stop (1.5× ATR).`));
  }

  return out.sort((a, b) => b.strength - a.strength);
}

export const STRATEGY_CATALOG = [
  { id: "opening_range_breakout", name: "Opening Range Breakout" },
  { id: "vwap_reversion", name: "VWAP Reversion" },
  { id: "vwap_trend", name: "VWAP Trend Follow" },
  { id: "ma_crossover", name: "Moving Average Crossover" },
  { id: "rsi_reversion", name: "RSI Mean Reversion" },
  { id: "bollinger_reversion", name: "Bollinger Band Reversion" },
  { id: "momentum_ranking", name: "Momentum Ranking" },
  { id: "gap_and_go", name: "Gap-and-Go" },
  { id: "gap_fade", name: "Gap Fade" },
  { id: "atr_breakout", name: "ATR Volatility Breakout" },
  { id: "index_pullback", name: "Index ETF Pullback Buying" },
  { id: "sentiment_momentum", name: "News/Sentiment Momentum" },
  { id: "trailing_stop", name: "Trailing Stop Trend Bot" },
];
