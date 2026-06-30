import type { SentimentMention } from "./types";
import { labelFromScore, scoreText } from "./lexicon";
import { isoDaysAgo } from "./utils";

const BASE = "https://api.quiverquant.com/beta";
const LOOKBACK_DAYS = 30;
const MAX_ROWS_PER_DATASET = 40;

type QuiverRow = Record<string, unknown>;

import { getQuiverApiKey } from "@/lib/quiver/env";

function quiverHeaders(auth: string): HeadersInit {
  return {
    accept: "application/json",
    Authorization: `Token ${auth}`,
  };
}

function isUpgradePayload(text: string): boolean {
  return text.includes("Upgrade your subscription");
}

function asRows(data: unknown): QuiverRow[] {
  if (Array.isArray(data)) return data as QuiverRow[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as QuiverRow[];
    if (Array.isArray(obj.ownership)) return obj.ownership as QuiverRow[];
  }
  return [];
}

function parseQuiverDate(row: QuiverRow): string | undefined {
  const keys = [
    "time",
    "Date",
    "Datetime",
    "TransactionDate",
    "ReportDate",
    "Filed",
    "Traded",
    "last_modified",
    "Uploaded",
  ];
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    if (typeof v === "number" && v > 0) {
      const ms = v > 1e12 ? v : v * 1000;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  return undefined;
}

function withinLookback(publishedAt?: string): boolean {
  if (!publishedAt) return true;
  const cutoff = Date.now() - LOOKBACK_DAYS * 86_400_000;
  return new Date(publishedAt).getTime() >= cutoff;
}

function tradeDirectionScore(transaction: string): number {
  const t = transaction.toLowerCase();
  if (t.includes("purchase") || t.includes("buy")) return 0.55;
  if (t.includes("sale") || t.includes("sell")) return -0.55;
  return 0;
}

function wsbHypeScore(mentions: number): number {
  if (mentions <= 0) return 0;
  return Math.min(0.45, Math.log10(mentions + 1) * 0.18);
}

function mention(
  id: string,
  title: string,
  opts: {
    summary?: string;
    url?: string;
    publishedAt?: string;
    score: number;
    dataset: string;
    meta?: Record<string, string | number>;
  }
): SentimentMention {
  return {
    id: `quiver-${id}`,
    source: "quiver",
    title,
    summary: opts.summary,
    url: opts.url,
    publishedAt: opts.publishedAt,
    score: opts.score,
    label: labelFromScore(opts.score),
    meta: { dataset: opts.dataset, ...opts.meta },
  };
}

async function quiverGet(
  auth: string,
  path: string,
  params?: Record<string, string>
): Promise<unknown> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: quiverHeaders(auth),
    next: { revalidate: 0 },
  });
  const text = await res.text();
  if (!res.ok || isUpgradePayload(text)) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function mapNews(ticker: string, data: unknown): SentimentMention[] {
  return asRows(data)
    .slice(0, MAX_ROWS_PER_DATASET)
    .map((row, i) => {
      const title = String(row.Title ?? row.title ?? row.headline ?? "Quiver news");
      const summary = String(row.Description ?? row.description ?? row.summary ?? "");
      const text = `${title} ${summary}`;
      const publishedAt = parseQuiverDate(row);
      return mention(`news-${ticker}-${i}-${publishedAt ?? i}`, title, {
        summary: summary.slice(0, 280) || undefined,
        url: typeof row.url === "string" ? row.url : typeof row.URL === "string" ? row.URL : undefined,
        publishedAt,
        score: scoreText(text),
        dataset: "news",
        meta: { ticker },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

function mapCongress(ticker: string, data: unknown, dataset: string): SentimentMention[] {
  return asRows(data)
    .slice(0, MAX_ROWS_PER_DATASET)
    .map((row, i) => {
      const politician = String(
        row.Representative ?? row.Senator ?? row.Name ?? row.representative ?? "Politician"
      );
      const transaction = String(row.Transaction ?? row.transaction ?? row.Type ?? "");
      const amount = String(row.Range ?? row.Amount ?? row.amount ?? "");
      const publishedAt = parseQuiverDate(row);
      const score = tradeDirectionScore(transaction);
      const title = `${dataset}: ${politician} — ${transaction || "trade"} ${ticker}`;
      return mention(`${dataset}-${ticker}-${i}-${publishedAt ?? i}`, title, {
        summary: amount ? `Reported amount: ${amount}` : undefined,
        publishedAt,
        score,
        dataset,
        meta: { ticker, transaction },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

function mapInsiders(ticker: string, data: unknown): SentimentMention[] {
  return asRows(data)
    .slice(0, MAX_ROWS_PER_DATASET)
    .map((row, i) => {
      const name = String(row.Name ?? row.Insider ?? row.name ?? "Insider");
      const code = String(row.TransactionCode ?? row.transaction_code ?? row.Type ?? "");
      const shares = row.Shares ?? row.shares ?? row.Quantity;
      const publishedAt = parseQuiverDate(row);
      const transaction =
        code === "P" ? "Purchase" : code === "S" ? "Sale" : code || "Transaction";
      const score = tradeDirectionScore(transaction);
      const title = `Insider: ${name} — ${transaction} ${ticker}`;
      return mention(`insider-${ticker}-${i}-${publishedAt ?? i}`, title, {
        summary:
          typeof shares === "number" ? `${shares.toLocaleString()} shares` : undefined,
        publishedAt,
        score,
        dataset: "insiders",
        meta: { ticker, transactionCode: code },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

function mapWsb(ticker: string, data: unknown): SentimentMention[] {
  return asRows(data)
    .slice(0, MAX_ROWS_PER_DATASET)
    .map((row, i) => {
      const mentions = Number(row.Mentions ?? row.mentions ?? row.Count ?? 0);
      const rank = Number(row.Rank ?? row.rank ?? 0);
      const publishedAt = parseQuiverDate(row);
      const score = wsbHypeScore(mentions);
      const title = `WSB: ${ticker} — ${mentions} mentions${rank > 0 ? ` (rank #${rank})` : ""}`;
      return mention(`wsb-${ticker}-${i}-${publishedAt ?? i}`, title, {
        publishedAt,
        score,
        dataset: "wallstreetbets",
        meta: { ticker, mentions, rank },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

function mapTwitter(ticker: string, data: unknown): SentimentMention[] {
  return asRows(data)
    .slice(0, MAX_ROWS_PER_DATASET)
    .map((row, i) => {
      const followers = Number(row.Followers ?? row.followers ?? row.Count ?? 0);
      const publishedAt = parseQuiverDate(row);
      const score = Math.min(0.35, Math.log10(followers + 1) * 0.12);
      const title = `Twitter interest: ${ticker} — ${followers.toLocaleString()} followers`;
      return mention(`twitter-${ticker}-${i}-${publishedAt ?? i}`, title, {
        publishedAt,
        score,
        dataset: "twitter",
        meta: { ticker, followers },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

function mapWsbComments(ticker: string, data: unknown): SentimentMention[] {
  return asRows(data)
    .slice(0, MAX_ROWS_PER_DATASET)
    .map((row, i) => {
      const body = String(row.Body ?? row.Comment ?? row.comment ?? row.text ?? "");
      const publishedAt = parseQuiverDate(row);
      const score = body ? scoreText(body) : 0;
      const title = body.slice(0, 120) || `WSB comment on ${ticker}`;
      return mention(`wsb-comment-${ticker}-${i}-${publishedAt ?? i}`, title, {
        summary: body.slice(0, 280) || undefined,
        publishedAt,
        score,
        dataset: "wsb_comments",
        meta: { ticker },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

function mapOffExchange(ticker: string, data: unknown): SentimentMention[] {
  return asRows(data)
    .slice(0, 15)
    .map((row, i) => {
      const otc = Number(row.OTC ?? row.otc ?? row.OffExchange ?? 0);
      const total = Number(row.Total ?? row.total ?? row.Volume ?? 0);
      const ratio = total > 0 ? otc / total : 0;
      const publishedAt = parseQuiverDate(row);
      // Elevated off-exchange share often coincides with defensive/hedged positioning.
      const score = ratio >= 0.55 ? -0.25 : ratio <= 0.35 ? 0.15 : 0;
      const pct = Math.round(ratio * 1000) / 10;
      const title = `Off-exchange volume: ${ticker} — ${pct}% OTC`;
      return mention(`offexchange-${ticker}-${i}-${publishedAt ?? i}`, title, {
        publishedAt,
        score,
        dataset: "offexchange",
        meta: { ticker, otcPct: pct },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

function mapLobbying(ticker: string, data: unknown): SentimentMention[] {
  return asRows(data)
    .slice(0, 20)
    .map((row, i) => {
      const issue = String(row.Issue ?? row.issue ?? row.Description ?? "Lobbying activity");
      const amount = Number(row.Amount ?? row.amount ?? 0);
      const publishedAt = parseQuiverDate(row);
      const score = scoreText(issue) * 0.5;
      const title = `Lobbying: ${ticker} — ${issue.slice(0, 80)}`;
      return mention(`lobbying-${ticker}-${i}-${publishedAt ?? i}`, title, {
        summary: amount > 0 ? `Spend: $${amount.toLocaleString()}` : undefined,
        publishedAt,
        score,
        dataset: "lobbying",
        meta: { ticker, amount },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

function mapGovContracts(ticker: string, data: unknown): SentimentMention[] {
  return asRows(data)
    .slice(0, 20)
    .map((row, i) => {
      const agency = String(row.Agency ?? row.agency ?? "Government");
      const amount = Number(row.Amount ?? row.amount ?? row.Value ?? 0);
      const publishedAt = parseQuiverDate(row);
      const score = amount >= 1_000_000 ? 0.35 : amount >= 100_000 ? 0.15 : 0.05;
      const title = `Gov contract: ${ticker} — ${agency}`;
      return mention(`govcontract-${ticker}-${i}-${publishedAt ?? i}`, title, {
        summary: amount > 0 ? `Value: $${amount.toLocaleString()}` : undefined,
        publishedAt,
        score,
        dataset: "gov_contracts",
        meta: { ticker, amount },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

function mapWikipedia(ticker: string, data: unknown): SentimentMention[] {
  return asRows(data)
    .slice(0, 15)
    .map((row, i) => {
      const views = Number(row.Views ?? row.views ?? row.PageViews ?? 0);
      const publishedAt = parseQuiverDate(row);
      const score = Math.min(0.3, Math.log10(views + 1) * 0.08);
      const title = `Wikipedia views: ${ticker} — ${views.toLocaleString()}`;
      return mention(`wikipedia-${ticker}-${i}-${publishedAt ?? i}`, title, {
        publishedAt,
        score,
        dataset: "wikipedia",
        meta: { ticker, views },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

function mapSec13fChanges(ticker: string, data: unknown): SentimentMention[] {
  return asRows(data)
    .slice(0, MAX_ROWS_PER_DATASET)
    .map((row, i) => {
      const owner = String(row.Owner ?? row.owner ?? row.Filer ?? "Fund");
      const change = Number(row.Change ?? row.change ?? row.ChangeInShares ?? 0);
      const publishedAt = parseQuiverDate(row);
      const score = change > 0 ? 0.35 : change < 0 ? -0.35 : 0;
      const title = `13F change: ${owner} — ${change > 0 ? "+" : ""}${change.toLocaleString()} ${ticker} shares`;
      return mention(`sec13f-${ticker}-${i}-${publishedAt ?? i}`, title, {
        publishedAt,
        score,
        dataset: "sec13f_changes",
        meta: { ticker, change },
      });
    })
    .filter((m) => withinLookback(m.publishedAt));
}

/** Quiver Quantitative alternative data (news, WSB, congress, insiders, etc.). */
export async function fetchQuiver(symbol: string): Promise<SentimentMention[]> {
  const auth = getQuiverApiKey();
  if (!auth) return [];

  const ticker = symbol.toUpperCase();
  const dateFrom = isoDaysAgo(LOOKBACK_DAYS).replace(/-/g, "");

  const [
    news,
    wsb,
    twitter,
    congress,
    senate,
    house,
    insiders,
    wsbComments,
    offExchange,
    lobbying,
    govContracts,
    wikipedia,
    sec13f,
  ] = await Promise.all([
    quiverGet(auth, "/live/quivernews", { ticker, page_size: String(MAX_ROWS_PER_DATASET) }),
    quiverGet(auth, `/historical/wallstreetbets/${ticker}`),
    quiverGet(auth, `/historical/twitter/${ticker}`),
    quiverGet(auth, `/historical/congresstrading/${ticker}`),
    quiverGet(auth, `/historical/senatetrading/${ticker}`),
    quiverGet(auth, `/historical/housetrading/${ticker}`),
    quiverGet(auth, "/live/insiders", { ticker }),
    quiverGet(auth, "/live/wsbcommentsfull", { ticker, date_from: dateFrom }),
    quiverGet(auth, `/historical/offexchange/${ticker}`),
    quiverGet(auth, `/historical/lobbying/${ticker}`),
    quiverGet(auth, `/historical/govcontractsall/${ticker}`),
    quiverGet(auth, `/historical/wikipedia/${ticker}`),
    quiverGet(auth, "/live/sec13fchanges", { ticker }),
  ]);

  return [
    ...mapNews(ticker, news),
    ...mapWsb(ticker, wsb),
    ...mapTwitter(ticker, twitter),
    ...mapCongress(ticker, congress, "congress"),
    ...mapCongress(ticker, senate, "senate"),
    ...mapCongress(ticker, house, "house"),
    ...mapInsiders(ticker, insiders),
    ...mapWsbComments(ticker, wsbComments),
    ...mapOffExchange(ticker, offExchange),
    ...mapLobbying(ticker, lobbying),
    ...mapGovContracts(ticker, govContracts),
    ...mapWikipedia(ticker, wikipedia),
    ...mapSec13fChanges(ticker, sec13f),
  ];
}
