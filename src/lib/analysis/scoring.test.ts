import { describe, expect, it } from "vitest";
import type { QuiverRawEvent } from "@/lib/quiver/types";
import { scoreCongressEvent } from "./congressScoring";
import { computeRiskScore, recommend, scoreTicker } from "./scoring";
import { filterEventsNoLookahead } from "@/lib/backtest/backtester";
import { disclosureLagDays, recencyWeight, tradeDirection } from "@/lib/quiver/normalize";

function congressEvent(overrides: Partial<QuiverRawEvent> = {}): QuiverRawEvent {
  const now = new Date().toISOString();
  return {
    id: "test-1",
    uniqueHash: "hash-1",
    sourceDataset: "congress_trades",
    ticker: "AAPL",
    actorName: "Rep. Test",
    actorType: "politician",
    transactionType: "Purchase",
    amountEstimate: 50_000,
    eventDate: now,
    filedDate: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("congress scoring", () => {
  it("scores purchases positive and sales negative", () => {
    const buy = scoreCongressEvent(congressEvent({ transactionType: "Purchase" }), []);
    const sell = scoreCongressEvent(congressEvent({ transactionType: "Sale" }), []);
    expect(buy).toBeGreaterThan(0);
    expect(sell).toBeLessThan(0);
  });

  it("applies disclosure lag penalty", () => {
    const filed = new Date().toISOString();
    const tradedSlow = new Date();
    tradedSlow.setDate(tradedSlow.getDate() - 90);
    const tradedFast = new Date();
    tradedFast.setDate(tradedFast.getDate() - 5);
    const slow = congressEvent({
      eventDate: tradedSlow.toISOString(),
      filedDate: filed,
    });
    const fast = congressEvent({
      eventDate: tradedFast.toISOString(),
      filedDate: filed,
      uniqueHash: "fast",
      id: "fast",
    });
    expect(disclosureLagDays(slow)).toBeGreaterThan(disclosureLagDays(fast));
    expect(scoreCongressEvent(slow, [])).toBeLessThan(scoreCongressEvent(fast, []));
  });

  it("decays recency for older trades", () => {
    const recent = new Date().toISOString();
    const old = new Date(Date.now() - 120 * 86_400_000).toISOString();
    expect(recencyWeight(recent)).toBeGreaterThan(recencyWeight(old));
  });

  it("boosts cluster buys", () => {
    const events = [
      congressEvent({ actorName: "A", uniqueHash: "a", id: "a" }),
      congressEvent({ actorName: "B", uniqueHash: "b", id: "b" }),
      congressEvent({ actorName: "C", uniqueHash: "c", id: "c" }),
    ];
    const single = scoreCongressEvent(congressEvent(), []);
    const clustered = scoreCongressEvent(congressEvent(), events);
    expect(clustered).toBeGreaterThan(single);
  });
});

describe("aggregate scoring", () => {
  it("weights insider buys above neutral baseline", () => {
    const events: QuiverRawEvent[] = [
      {
        ...congressEvent(),
        id: "ins-1",
        uniqueHash: "ins-1",
        sourceDataset: "insider_trades",
        actorType: "insider",
        actorName: "CEO",
        transactionType: "Purchase",
        amountEstimate: 1_000_000,
      },
    ];
    const result = scoreTicker("AAPL", events, 90);
    expect(result.datasets.find((d) => d.dataset === "insider_trades")!.score).toBeGreaterThan(0);
  });

  it("computes risk from bearish signals", () => {
    const events = [
      congressEvent({ transactionType: "Sale" }),
      congressEvent({ transactionType: "Sale", uniqueHash: "s2", id: "s2", actorName: "B" }),
    ];
    const { datasets, totalSentiment } = scoreTicker("AAPL", events, 90);
    const risk = computeRiskScore(events, "AAPL", datasets, totalSentiment);
    expect(risk).toBeGreaterThan(15);
  });

  it("maps recommendation thresholds", () => {
    expect(recommend(75, 40)).toBe("Strong Bullish");
    expect(recommend(50, 30)).toBe("Bullish");
    expect(recommend(25, 30)).toBe("Slightly Bullish");
    expect(recommend(0, 30)).toBe("Neutral");
    expect(recommend(-50, 30)).toBe("Bearish");
    expect(recommend(-80, 30)).toBe("Strong Bearish");
    expect(recommend(30, 80)).toBe("Caution");
  });
});

describe("backtest no-lookahead", () => {
  it("excludes events filed after as-of date", () => {
    const early = congressEvent({ filedDate: "2024-01-01T00:00:00.000Z", uniqueHash: "e1", id: "e1" });
    const late = congressEvent({ filedDate: "2024-06-01T00:00:00.000Z", uniqueHash: "e2", id: "e2" });
    const filtered = filterEventsNoLookahead([early, late], "2024-03-01T00:00:00.000Z");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.uniqueHash).toBe("e1");
  });
});

describe("trade direction", () => {
  it("classifies purchase and sale", () => {
    expect(tradeDirection("Purchase")).toBe(1);
    expect(tradeDirection("Sale")).toBe(-1);
    expect(tradeDirection("Exchange")).toBe(0);
  });
});
