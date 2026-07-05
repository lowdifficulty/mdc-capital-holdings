import "server-only";
import { stableHash } from "./client";
import type { ActorType, QuiverDataset, QuiverRawEvent } from "./types";

type Row = Record<string, unknown>;

function pickDate(row: Row, keys: string[]): string | undefined {
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

function pickTicker(row: Row): string {
  const t = row.Ticker ?? row.ticker ?? row.Symbol ?? row.symbol ?? "";
  return String(t).toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 8);
}

function parseAmountRange(range: unknown): { min?: number; max?: number; estimate?: number } {
  if (typeof range !== "string") return {};
  const nums = range.match(/[\d,]+/g)?.map((n) => Number(n.replace(/,/g, ""))) ?? [];
  if (!nums.length) return {};
  const min = nums[0];
  const max = nums.length > 1 ? nums[1] : nums[0];
  return { min, max, estimate: (min + max) / 2 };
}

function parseNumericAmount(row: Row): number | undefined {
  const v = row.Amount ?? row.amount ?? row.Value ?? row.value;
  if (typeof v === "number" && v > 0) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,]/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  const range = parseAmountRange(row.Range ?? row.Amount ?? row.range);
  return range.estimate;
}

function baseEvent(
  dataset: QuiverDataset,
  row: Row,
  overrides: Partial<QuiverRawEvent>
): QuiverRawEvent | null {
  const ticker = overrides.ticker ?? pickTicker(row);
  if (!ticker) return null;

  const eventDate = overrides.eventDate ?? pickDate(row, [
    "TransactionDate", "Traded", "Date", "time", "ReportDate", "Filed",
  ]);
  const filedDate = overrides.filedDate ?? pickDate(row, [
    "ReportDate", "Filed", "Uploaded", "last_modified",
  ]);

  const hashParts = [
    dataset,
    ticker,
    eventDate ?? "",
    filedDate ?? "",
    String(overrides.actorName ?? row.Representative ?? row.Name ?? ""),
    String(overrides.transactionType ?? row.Transaction ?? ""),
    String(overrides.description ?? row.Description ?? "").slice(0, 80),
  ];

  const now = new Date().toISOString();
  return {
    id: stableHash(hashParts),
    uniqueHash: stableHash(hashParts),
    sourceDataset: dataset,
    ticker,
    companyName: String(row.Company ?? row.company ?? row.Name ?? "").slice(0, 120) || undefined,
    eventDate,
    filedDate,
    actorName: overrides.actorName,
    actorType: overrides.actorType ?? "unknown",
    transactionType: overrides.transactionType,
    rawAmount: typeof row.Range === "string" ? row.Range : undefined,
    amountMin: overrides.amountMin,
    amountMax: overrides.amountMax,
    amountEstimate: overrides.amountEstimate,
    party: overrides.party,
    chamber: overrides.chamber,
    description: overrides.description,
    rawPayload: row,
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeCongressRow(
  row: Row,
  dataset: QuiverDataset,
  chamber?: string
): QuiverRawEvent | null {
  const politician = String(row.Representative ?? row.Senator ?? row.Name ?? "Unknown");
  const transaction = String(row.Transaction ?? row.transaction ?? "");
  const amounts = parseAmountRange(row.Range ?? row.Amount);
  const amountEstimate = amounts.estimate ?? parseNumericAmount(row);

  return baseEvent(dataset, row, {
    actorName: politician,
    actorType: "politician",
    transactionType: transaction,
    amountMin: amounts.min,
    amountMax: amounts.max,
    amountEstimate,
    party: String(row.Party ?? row.party ?? "").slice(0, 20) || undefined,
    chamber: chamber ?? (String(row.Chamber ?? row.chamber ?? "").slice(0, 20) || undefined),
    description: `${politician} ${transaction}`.trim(),
  });
}

export function normalizeInsiderRow(row: Row): QuiverRawEvent | null {
  const name = String(row.Name ?? row.Insider ?? "Insider");
  const code = String(row.TransactionCode ?? row.Type ?? "");
  const transaction =
    code === "P" ? "Purchase" : code === "S" ? "Sale" : code || "Transaction";

  return baseEvent("insider_trades", row, {
    actorName: name,
    actorType: "insider",
    transactionType: transaction,
    amountEstimate: parseNumericAmount(row),
    description: `Insider ${name}: ${transaction}`,
  });
}

export function normalizeHedgeFundRow(row: Row): QuiverRawEvent | null {
  const owner = String(row.Owner ?? row.owner ?? row.Filer ?? "Fund");
  const change = Number(row.Change ?? row.change ?? row.ChangeInShares ?? 0);
  const transaction =
    change > 0 ? "Increase" : change < 0 ? "Decrease" : "Hold";

  return baseEvent("hedge_fund_activity", row, {
    actorName: owner,
    actorType: "fund",
    transactionType: transaction,
    amountEstimate: Math.abs(change),
    description: `${owner} ${transaction} position`,
  });
}

export function normalizeGovContractRow(row: Row): QuiverRawEvent | null {
  const agency = String(row.Agency ?? row.agency ?? "Government");
  return baseEvent("government_contracts", row, {
    actorName: agency,
    actorType: "agency",
    transactionType: "Award",
    amountEstimate: parseNumericAmount(row),
    description: `Contract from ${agency}`,
  });
}

export function normalizeLobbyingRow(row: Row): QuiverRawEvent | null {
  const issue = String(row.Issue ?? row.issue ?? row.Description ?? "Lobbying");
  return baseEvent("corporate_lobbying", row, {
    actorType: "company",
    transactionType: "Lobbying",
    amountEstimate: parseNumericAmount(row),
    description: issue.slice(0, 200),
  });
}

export function normalizeDonorRow(row: Row): QuiverRawEvent | null {
  return baseEvent("corporate_donors", row, {
    actorType: "company",
    transactionType: "Donation",
    amountEstimate: parseNumericAmount(row),
    description: String(row.Recipient ?? row.Party ?? "Political donation").slice(0, 120),
  });
}

export function normalizePatentRow(row: Row): QuiverRawEvent | null {
  return baseEvent("patents", row, {
    actorType: "company",
    transactionType: "Patent",
    description: String(row.Title ?? row.Patent ?? "Patent filing").slice(0, 200),
  });
}

export function normalizeOffExchangeRow(row: Row): QuiverRawEvent | null {
  const otc = Number(row.OTC ?? row.otc ?? 0);
  const total = Number(row.Total ?? row.total ?? row.Volume ?? 0);
  return baseEvent("off_exchange_short_volume", row, {
    actorType: "unknown",
    transactionType: "OffExchange",
    amountEstimate: total > 0 ? otc / total : undefined,
    description: `OTC ratio ${total > 0 ? ((otc / total) * 100).toFixed(1) : "?"}%`,
  });
}

export function normalizeNewsRow(row: Row): QuiverRawEvent | null {
  const title = String(row.Title ?? row.title ?? row.headline ?? row.Headline ?? "News");
  return baseEvent("newsfeed", row, {
    actorType: "news",
    transactionType: "Headline",
    eventDate: pickDate(row, ["time", "publishedAt", "published_at", "date"]),
    filedDate: pickDate(row, ["time", "publishedAt", "published_at", "date"]),
    description: title.slice(0, 280),
  });
}

export function normalizeSocialRow(row: Row): QuiverRawEvent | null {
  const mentions = Number(row.Mentions ?? row.mentions ?? 0);
  return baseEvent("social", row, {
    actorType: "social",
    transactionType: "Mention",
    amountEstimate: mentions,
    description: `WSB mentions: ${mentions}`,
  });
}

export function normalizeRows(dataset: QuiverDataset, data: unknown): QuiverRawEvent[] {
  const rows = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as Row).data)
      ? ((data as Row).data as Row[])
      : [];

  const out: QuiverRawEvent[] = [];
  for (const row of rows) {
    let event: QuiverRawEvent | null = null;
    switch (dataset) {
      case "congress_trades":
        event = normalizeCongressRow(row, dataset, "Congress");
        break;
      case "senate_trades":
        event = normalizeCongressRow(row, dataset, "Senate");
        break;
      case "house_trades":
        event = normalizeCongressRow(row, dataset, "House");
        break;
      case "insider_trades":
        event = normalizeInsiderRow(row);
        break;
      case "hedge_fund_activity":
        event = normalizeHedgeFundRow(row);
        break;
      case "government_contracts":
        event = normalizeGovContractRow(row);
        break;
      case "corporate_lobbying":
        event = normalizeLobbyingRow(row);
        break;
      case "corporate_donors":
        event = normalizeDonorRow(row);
        break;
      case "patents":
        event = normalizePatentRow(row);
        break;
      case "off_exchange_short_volume":
        event = normalizeOffExchangeRow(row);
        break;
      case "newsfeed":
        event = normalizeNewsRow(row);
        break;
      case "social":
        event = normalizeSocialRow(row);
        break;
      default:
        break;
    }
    if (event) out.push(event);
  }
  return out;
}

export function congressDatasetKey(dataset: QuiverDataset): boolean {
  return dataset === "congress_trades" || dataset === "senate_trades" || dataset === "house_trades";
}

export function isCongressEvent(e: QuiverRawEvent): boolean {
  return congressDatasetKey(e.sourceDataset);
}

export function tradeDirection(transaction?: string): number {
  const t = (transaction ?? "").toLowerCase();
  if (t.includes("purchase") || t.includes("buy") || t.includes("increase")) return 1;
  if (t.includes("sale") || t.includes("sell") || t.includes("decrease") || t.includes("closed")) return -1;
  return 0;
}

export function disclosureLagDays(event: QuiverRawEvent): number {
  if (!event.eventDate || !event.filedDate) return 30;
  const lag = (new Date(event.filedDate).getTime() - new Date(event.eventDate).getTime()) / 86_400_000;
  return Math.max(0, lag);
}

export function recencyWeight(isoDate: string | undefined, halfLifeDays = 45): number {
  if (!isoDate) return 0.3;
  const days = (Date.now() - new Date(isoDate).getTime()) / 86_400_000;
  return Math.exp(-days / halfLifeDays);
}

export function amountWeight(estimate?: number): number {
  if (!estimate || estimate <= 0) return 0.25;
  return Math.min(1, Math.log10(estimate + 1) / 5);
}
