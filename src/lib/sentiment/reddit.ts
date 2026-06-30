import type { SentimentMention } from "./types";
import { labelFromScore, scoreText } from "./lexicon";

const UA = "MDC-Capital-Sentiment/1.0 (contact: admin@mdccapitalholdings.com)";

interface RedditChild {
  data: {
    title: string;
    selftext?: string;
    permalink: string;
    created_utc: number;
    subreddit: string;
    url: string;
  };
}

interface RedditListing {
  data?: { children?: RedditChild[] };
}

const SUBREDDITS = [
  "stocks",
  "investing",
  "wallstreetbets",
  "StockMarket",
  "options",
  "smallstreetbets",
];

export async function fetchRedditMentions(symbol: string): Promise<SentimentMention[]> {
  const mentions: SentimentMention[] = [];
  const seen = new Set<string>();

  await Promise.all(
    SUBREDDITS.map(async (subreddit) => {
      const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(symbol)}&restrict_sr=1&sort=new&limit=15`;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": UA },
          next: { revalidate: 0 },
        });
        if (!res.ok) return;
        const json = (await res.json()) as RedditListing;
        const children = json.data?.children ?? [];

        for (const child of children) {
          const { title, selftext, permalink, created_utc, subreddit: sub } = child.data;
          const haystack = `${title} ${selftext ?? ""}`.toUpperCase();
          if (!haystack.includes(symbol.toUpperCase())) continue;

          const key = permalink;
          if (seen.has(key)) continue;
          seen.add(key);

          const text = `${title} ${selftext ?? ""}`;
          const score = scoreText(text);
          mentions.push({
            id: `reddit-${permalink}`,
            source: "reddit",
            title: `r/${sub}: ${title}`,
            summary: selftext?.slice(0, 280) || undefined,
            url: `https://www.reddit.com${permalink}`,
            publishedAt: new Date(created_utc * 1000).toISOString(),
            score,
            label: labelFromScore(score),
          });
        }
      } catch {
        // Reddit may rate-limit; skip this subreddit
      }
    })
  );

  return mentions
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, 30);
}
