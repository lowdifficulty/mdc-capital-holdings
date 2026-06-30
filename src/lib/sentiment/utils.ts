import type { SentimentMention, SentimentLabel, SentimentSource } from "./types";
import { labelFromScore } from "./lexicon";

export const MS_PER_DAY = 86_400_000;
export const MS_PER_HOUR = 3_600_000;

/** Reddit-derived sources count at 1/10 influence vs other platforms in aggregate scores. */
export const REDDIT_INFLUENCE_WEIGHT = 0.1;

const REDDIT_SOURCES = new Set<SentimentSource>([
  "reddit",
  "apewisdom",
  "swaggystocks",
  "finnhub_social",
]);

export function mentionInfluenceWeight(mention: SentimentMention): number {
  if (REDDIT_SOURCES.has(mention.source)) return REDDIT_INFLUENCE_WEIGHT;
  return 1;
}

export function parseMentionDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function filterMentionsByHours(
  mentions: SentimentMention[],
  hours: number,
  now = new Date()
): SentimentMention[] {
  const cutoff = now.getTime() - hours * MS_PER_HOUR;
  return mentions.filter((m) => {
    const d = parseMentionDate(m.publishedAt);
    if (!d) return false;
    return d.getTime() >= cutoff;
  });
}

export function filterMentionsBetweenHours(
  mentions: SentimentMention[],
  startHoursAgo: number,
  endHoursAgo: number,
  now = new Date()
): SentimentMention[] {
  const start = now.getTime() - startHoursAgo * MS_PER_HOUR;
  const end = now.getTime() - endHoursAgo * MS_PER_HOUR;
  return mentions.filter((m) => {
    const d = parseMentionDate(m.publishedAt);
    if (!d) return false;
    const t = d.getTime();
    return t >= start && t < end;
  });
}

export function filterMentionsByDays(
  mentions: SentimentMention[],
  days: number,
  now = new Date()
): SentimentMention[] {
  const cutoff = now.getTime() - days * MS_PER_DAY;
  return mentions.filter((m) => {
    const d = parseMentionDate(m.publishedAt);
    if (!d) return days >= 30;
    return d.getTime() >= cutoff;
  });
}

export function filterMentionsBetweenDays(
  mentions: SentimentMention[],
  startDaysAgo: number,
  endDaysAgo: number,
  now = new Date()
): SentimentMention[] {
  const start = now.getTime() - startDaysAgo * MS_PER_DAY;
  const end = now.getTime() - endDaysAgo * MS_PER_DAY;
  return mentions.filter((m) => {
    const d = parseMentionDate(m.publishedAt);
    if (!d) return false;
    const t = d.getTime();
    return t >= start && t < end;
  });
}

export function averageScore(mentions: SentimentMention[]): number {
  if (!mentions.length) return 0;
  return mentions.reduce((sum, m) => sum + m.score, 0) / mentions.length;
}

export function weightedAverageScore(mentions: SentimentMention[]): number {
  if (!mentions.length) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const m of mentions) {
    const w = mentionInfluenceWeight(m);
    weightedSum += m.score * w;
    totalWeight += w;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function buildReportFromMentions(
  mentions: SentimentMention[],
  symbol: string,
  analyzedAt: string,
  warnings: string[]
) {
  const overallScore = weightedAverageScore(mentions);
  return {
    symbol,
    analyzedAt,
    overallScore,
    overallLabel: labelFromScore(overallScore) as SentimentLabel,
    mentionCount: mentions.length,
    mentions,
    warnings,
  };
}

export function isoDaysAgo(days: number, now = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
