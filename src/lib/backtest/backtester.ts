import type { QuiverRawEvent } from "@/lib/quiver/types";
import { isCongressEvent, tradeDirection } from "@/lib/quiver/normalize";
import { scoreCongressEvent } from "@/lib/analysis/congressScoring";
import type { BacktestTrade, ForwardReturns } from "./metrics";

export interface PriceBar {
  date: string;
  close: number;
}

function signalAvailableDate(event: QuiverRawEvent): string | undefined {
  return event.filedDate ?? event.eventDate;
}

function eventsKnownAsOf(events: QuiverRawEvent[], asOfIso: string): QuiverRawEvent[] {
  const asOf = new Date(asOfIso).getTime();
  return events.filter((e) => {
    const known = signalAvailableDate(e);
    if (!known) return false;
    return new Date(known).getTime() <= asOf;
  });
}

function forwardReturn(bars: PriceBar[], fromDate: string, days: number): number | undefined {
  const startIdx = bars.findIndex((b) => b.date >= fromDate.slice(0, 10));
  if (startIdx < 0) return undefined;
  const endIdx = startIdx + days;
  if (endIdx >= bars.length) return undefined;
  const start = bars[startIdx]!.close;
  const end = bars[endIdx]!.close;
  if (!start) return undefined;
  return ((end - start) / start) * 100;
}

export function backtestCongressSignals(
  events: QuiverRawEvent[],
  priceBarsByTicker: Record<string, PriceBar[]>
): BacktestTrade[] {
  const congress = events.filter(isCongressEvent);
  const trades: BacktestTrade[] = [];

  for (const event of congress) {
    const signalDate = signalAvailableDate(event);
    if (!signalDate) continue;

    const known = eventsKnownAsOf(events, signalDate);
    const sentiment = scoreCongressEvent(event, known);
    const direction = tradeDirection(event.transactionType);
    if (direction === 0) continue;

    const bars = priceBarsByTicker[event.ticker];
    if (!bars?.length) continue;

    const returns: ForwardReturns = {
      d1: forwardReturn(bars, signalDate, 1),
      d5: forwardReturn(bars, signalDate, 5),
      d10: forwardReturn(bars, signalDate, 10),
      d30: forwardReturn(bars, signalDate, 30),
      d90: forwardReturn(bars, signalDate, 90),
    };

    trades.push({
      ticker: event.ticker,
      signalDate,
      sentiment,
      source: event.sourceDataset,
      returns,
    });
  }

  return trades;
}

/** Ensures backtest never uses events filed after the evaluation date. */
export function filterEventsNoLookahead(
  events: QuiverRawEvent[],
  asOfIso: string
): QuiverRawEvent[] {
  return eventsKnownAsOf(events, asOfIso);
}
