import type { QuiverRawEvent } from "@/lib/quiver/types";
import { amountWeight, recencyWeight, tradeDirection } from "@/lib/quiver/normalize";

function insiderRoleWeight(name: string, title?: string): number {
  const t = `${name} ${title ?? ""}`.toLowerCase();
  if (t.includes("ceo") || t.includes("chief executive")) return 1.3;
  if (t.includes("cfo") || t.includes("chief financial")) return 1.2;
  if (t.includes("director") || t.includes("president")) return 1.15;
  return 1;
}

export function scoreInsiderDataset(events: QuiverRawEvent[], lookbackDays: number): {
  score: number;
  confidence: number;
  explanation: string;
} {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const insiders = events.filter((e) => {
    if (e.sourceDataset !== "insider_trades") return false;
    const t = new Date(e.filedDate ?? e.eventDate ?? 0).getTime();
    return t >= cutoff;
  });

  if (!insiders.length) {
    return { score: 0, confidence: 0, explanation: "No recent insider transactions." };
  }

  let weightedSum = 0;
  let weightTotal = 0;
  let buys = 0;
  let sells = 0;

  for (const e of insiders) {
    const dir = tradeDirection(e.transactionType);
    if (dir === 0) continue;
    const roleW = insiderRoleWeight(e.actorName ?? "", e.description);
    const conf = dir > 0 ? 1 : 0.65;
    const eventScore = 100 * dir * amountWeight(e.amountEstimate) * recencyWeight(e.filedDate ?? e.eventDate) * roleW * conf;
    weightedSum += eventScore;
    weightTotal += roleW;
    if (dir > 0) buys++;
    else sells++;
  }

  const score = weightTotal > 0 ? weightedSum / weightTotal : 0;
  const buyCluster = buys >= 2;
  const boost = buyCluster ? 1.15 : 1;
  const finalScore = Math.max(-100, Math.min(100, score * boost));

  let explanation = `${insiders.length} insider trade(s): ${buys} buy, ${sells} sell.`;
  if (buyCluster) explanation += " Clustered insider buying detected.";

  return {
    score: finalScore,
    confidence: Math.min(100, 25 + insiders.length * 10 + (buyCluster ? 15 : 0)),
    explanation,
  };
}

export function scoreHedgeFundDataset(events: QuiverRawEvent[], lookbackDays: number): {
  score: number;
  confidence: number;
  explanation: string;
} {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const funds = events.filter((e) => {
    if (e.sourceDataset !== "hedge_fund_activity") return false;
    const t = new Date(e.filedDate ?? e.eventDate ?? 0).getTime();
    return t >= cutoff;
  });

  if (!funds.length) {
    return { score: 0, confidence: 0, explanation: "No recent 13F changes." };
  }

  let sum = 0;
  let increases = 0;
  let decreases = 0;

  for (const e of funds) {
    const dir = tradeDirection(e.transactionType);
    const s = 100 * dir * amountWeight(e.amountEstimate) * recencyWeight(e.filedDate ?? e.eventDate);
    sum += s;
    if (dir > 0) increases++;
    if (dir < 0) decreases++;
  }

  return {
    score: Math.max(-100, Math.min(100, sum / funds.length)),
    confidence: Math.min(100, 20 + funds.length * 12),
    explanation: `${funds.length} institutional 13F change(s): ${increases} increase, ${decreases} decrease.`,
  };
}

export function scoreGovContractDataset(events: QuiverRawEvent[], lookbackDays: number): {
  score: number;
  confidence: number;
  explanation: string;
} {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const contracts = events.filter((e) => {
    if (e.sourceDataset !== "government_contracts") return false;
    const t = new Date(e.filedDate ?? e.eventDate ?? 0).getTime();
    return t >= cutoff;
  });

  if (!contracts.length) {
    return { score: 0, confidence: 0, explanation: "No recent government contracts." };
  }

  let sum = 0;
  for (const e of contracts) {
    const amt = e.amountEstimate ?? 0;
    const base = amt >= 1_000_000 ? 55 : amt >= 100_000 ? 30 : 15;
    sum += base * recencyWeight(e.filedDate ?? e.eventDate);
  }

  return {
    score: Math.max(0, Math.min(100, sum / contracts.length)),
    confidence: Math.min(100, 20 + contracts.length * 15),
    explanation: `${contracts.length} government contract award(s).`,
  };
}

export function scoreLobbyingDataset(events: QuiverRawEvent[], lookbackDays: number): {
  score: number;
  confidence: number;
  explanation: string;
} {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const rows = events.filter((e) => {
    if (e.sourceDataset !== "corporate_lobbying") return false;
    const t = new Date(e.filedDate ?? e.eventDate ?? 0).getTime();
    return t >= cutoff;
  });

  if (!rows.length) return { score: 0, confidence: 0, explanation: "No lobbying data." };

  const total = rows.reduce((s, e) => s + (e.amountEstimate ?? 0), 0);
  const score = Math.min(40, Math.log10(total + 1) * 12);

  return {
    score,
    confidence: Math.min(60, 15 + rows.length * 5),
    explanation: `Lobbying spend tracked across ${rows.length} filing(s).`,
  };
}

export function scoreDonorDataset(events: QuiverRawEvent[], lookbackDays: number): {
  score: number;
  confidence: number;
  explanation: string;
} {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const rows = events.filter((e) => {
    if (e.sourceDataset !== "corporate_donors") return false;
    const t = new Date(e.filedDate ?? e.eventDate ?? 0).getTime();
    return t >= cutoff;
  });
  if (!rows.length) return { score: 0, confidence: 0, explanation: "No donor data." };
  return {
    score: Math.min(20, rows.length * 3),
    confidence: Math.min(40, 10 + rows.length * 3),
    explanation: `${rows.length} corporate political donation record(s).`,
  };
}

export function scorePatentDataset(events: QuiverRawEvent[], lookbackDays: number): {
  score: number;
  confidence: number;
  explanation: string;
} {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const recent = events.filter((e) => {
    if (e.sourceDataset !== "patents") return false;
    return new Date(e.eventDate ?? e.filedDate ?? 0).getTime() >= cutoff;
  });
  const prior = events.filter((e) => {
    if (e.sourceDataset !== "patents") return false;
    const t = new Date(e.eventDate ?? e.filedDate ?? 0).getTime();
    return t < cutoff && t >= cutoff - lookbackDays * 86_400_000;
  });

  if (!recent.length && !prior.length) {
    return { score: 0, confidence: 0, explanation: "No patent activity." };
  }

  const velocity = recent.length - prior.length;
  const score = Math.max(-20, Math.min(60, velocity * 8 + recent.length * 4));

  return {
    score,
    confidence: Math.min(70, 15 + recent.length * 8),
    explanation: `${recent.length} recent patent(s); velocity vs prior window: ${velocity >= 0 ? "+" : ""}${velocity}.`,
  };
}

export function scoreOffExchangeDataset(events: QuiverRawEvent[], lookbackDays: number): {
  score: number;
  confidence: number;
  explanation: string;
} {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const rows = events
    .filter((e) => e.sourceDataset === "off_exchange_short_volume")
    .filter((e) => new Date(e.eventDate ?? e.filedDate ?? 0).getTime() >= cutoff)
    .sort((a, b) => (b.eventDate ?? "").localeCompare(a.eventDate ?? ""));

  if (!rows.length) return { score: 0, confidence: 0, explanation: "No off-exchange data." };

  const ratios = rows.map((e) => e.amountEstimate ?? 0).filter((r) => r > 0 && r <= 1);
  const latest = ratios[0] ?? 0.5;
  const avg = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : latest;
  const abnormal = latest - avg;

  const score = abnormal >= 0.1 ? -35 : abnormal <= -0.08 ? 15 : 0;

  return {
    score,
    confidence: Math.min(80, 25 + ratios.length * 5),
    explanation: `Off-exchange ratio ${(latest * 100).toFixed(1)}% vs ${(avg * 100).toFixed(1)}% avg.`,
  };
}

export function scoreNewsDataset(events: QuiverRawEvent[], lookbackDays: number): {
  score: number;
  confidence: number;
  explanation: string;
} {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const news = events.filter((e) => {
    if (e.sourceDataset !== "newsfeed") return false;
    return new Date(e.eventDate ?? e.filedDate ?? 0).getTime() >= cutoff;
  });

  if (!news.length) return { score: 0, confidence: 0, explanation: "No Quiver news headlines." };

  const positive = ["surge", "beat", "upgrade", "growth", "win", "approval", "contract", "bullish"];
  const negative = ["miss", "downgrade", "lawsuit", "decline", "bearish", "cut", "warning", "investigation"];

  let sum = 0;
  for (const e of news) {
    const text = (e.description ?? "").toLowerCase();
    let s = 0;
    for (const w of positive) if (text.includes(w)) s += 12;
    for (const w of negative) if (text.includes(w)) s -= 12;
    sum += Math.max(-100, Math.min(100, s)) * recencyWeight(e.eventDate ?? e.filedDate, 14);
  }

  return {
    score: Math.max(-100, Math.min(100, sum / news.length)),
    confidence: Math.min(90, 20 + news.length * 6),
    explanation: `${news.length} Quiver news headline(s) scored by lexicon.`,
  };
}

export function scoreSocialDataset(events: QuiverRawEvent[], lookbackDays: number): {
  score: number;
  confidence: number;
  explanation: string;
} {
  const cutoff = Date.now() - lookbackDays * 86_400_000;
  const social = events.filter((e) => {
    if (e.sourceDataset !== "social") return false;
    return new Date(e.eventDate ?? e.filedDate ?? 0).getTime() >= cutoff;
  });
  if (!social.length) return { score: 0, confidence: 0, explanation: "No social mention data." };

  const mentions = social.reduce((s, e) => s + (e.amountEstimate ?? 0), 0);
  const score = Math.min(45, Math.log10(mentions + 1) * 18);

  return {
    score,
    confidence: Math.min(50, 15 + social.length * 4),
    explanation: `WSB/social attention: ${mentions.toLocaleString()} mention units.`,
  };
}
