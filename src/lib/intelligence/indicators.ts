import type { OHLCVBar, TechnicalSnapshot } from "./types";

export function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function sma(values: number[], period: number): number {
  if (values.length < period) return values[values.length - 1] ?? 0;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

export function macd(closes: number[]) {
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const line = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  const macdSeries = ema12.map((v, i) => v - ema26[i]);
  const signalSeries = ema(macdSeries, 9);
  const signal = signalSeries[signalSeries.length - 1] ?? 0;
  return { line, signal, histogram: line - signal };
}

export function bollinger(closes: number[], period = 20, mult = 2) {
  const middle = sma(closes, period);
  const slice = closes.slice(-period);
  const variance =
    slice.reduce((sum, v) => sum + (v - middle) ** 2, 0) / Math.max(slice.length, 1);
  const std = Math.sqrt(variance);
  return { upper: middle + mult * std, middle, lower: middle - mult * std };
}

export function atr(bars: OHLCVBar[], period = 14): number {
  if (bars.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const h = bars[i].h;
    const l = bars[i].l;
    const pc = bars[i - 1].c;
    trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  return sma(trs, Math.min(period, trs.length));
}

export function vwap(bars: OHLCVBar[]): number {
  let pv = 0;
  let vol = 0;
  for (const b of bars) {
    const typical = (b.h + b.l + b.c) / 3;
    pv += typical * b.v;
    vol += b.v;
  }
  return vol > 0 ? pv / vol : bars[bars.length - 1]?.c ?? 0;
}

function pctReturn(closes: number[], days: number): number {
  if (closes.length <= days) return 0;
  const cur = closes[closes.length - 1];
  const prev = closes[closes.length - 1 - days];
  if (!prev) return 0;
  return ((cur - prev) / prev) * 100;
}

export function buildTechnicalSnapshot(
  dailyBars: OHLCVBar[],
  intradayBars: OHLCVBar[] = []
): TechnicalSnapshot | null {
  if (dailyBars.length < 30) return null;

  const closes = dailyBars.map((b) => b.c);
  const price = closes[closes.length - 1];
  const ema9 = ema(closes, 9);
  const ema20 = ema(closes, 20);
  const volumes = dailyBars.map((b) => b.v);
  const avgVol20 = sma(volumes, 20);

  const yearBars = dailyBars.slice(-252);
  const high52 = Math.max(...yearBars.map((b) => b.h));
  const low52 = Math.min(...yearBars.map((b) => b.l));

  const todayIntra = intradayBars.length ? intradayBars : dailyBars.slice(-1);
  const orBars = intradayBars.slice(0, Math.min(6, intradayBars.length));
  const orHigh = orBars.length ? Math.max(...orBars.map((b) => b.h)) : dailyBars.at(-1)!.h;
  const orLow = orBars.length ? Math.min(...orBars.map((b) => b.l)) : dailyBars.at(-1)!.l;

  const prevClose = dailyBars.at(-2)?.c ?? price;
  const gapPct = ((dailyBars.at(-1)!.o - prevClose) / prevClose) * 100;

  return {
    price,
    vwap: intradayBars.length ? vwap(intradayBars) : vwap(dailyBars.slice(-20)),
    ema9: ema9[ema9.length - 1],
    ema20: ema20[ema20.length - 1],
    sma50: sma(closes, 50),
    sma200: closes.length >= 200 ? sma(closes, 200) : sma(closes, closes.length),
    rsi14: rsi(closes),
    macd: macd(closes),
    bollinger: bollinger(closes),
    atr14: atr(dailyBars),
    relativeVolume: avgVol20 > 0 ? volumes[volumes.length - 1] / avgVol20 : 1,
    premarketGapPct: gapPct,
    openingRangeHigh: orHigh,
    openingRangeLow: orLow,
    distanceFrom52wHighPct: ((price - high52) / high52) * 100,
    distanceFrom52wLowPct: ((price - low52) / low52) * 100,
    return1d: pctReturn(closes, 1),
    return5d: pctReturn(closes, 5),
    return20d: pctReturn(closes, 20),
  };
}
