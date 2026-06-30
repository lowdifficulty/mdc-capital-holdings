import { fetchRss } from "./rss";
import type { SentimentMention } from "./types";
import { labelFromScore, scoreText } from "./lexicon";

const UA = "MDC-Capital-Sentiment/1.0";

function toMention(
  source: SentimentMention["source"],
  item: { title: string; link?: string; pubDate?: string; description?: string },
  index: number
): SentimentMention {
  const text = `${item.title} ${item.description ?? ""}`;
  const score = scoreText(text);
  return {
    id: `${source}-${index}-${item.title.slice(0, 24)}`,
    source,
    title: item.title,
    summary: item.description,
    url: item.link,
    publishedAt: item.pubDate,
    score,
    label: labelFromScore(score),
  };
}

export async function fetchGoogleNews(symbol: string): Promise<SentimentMention[]> {
  const query = encodeURIComponent(`${symbol} stock`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  const items = await fetchRss(url, UA);
  return items.slice(0, 20).map((item, i) => toMention("google_news", item, i));
}

export async function fetchCnbc(symbol: string): Promise<SentimentMention[]> {
  const query = encodeURIComponent(symbol);
  const url = `https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss&query=${query}`;
  const items = await fetchRss(url, UA);
  return items.slice(0, 15).map((item, i) => toMention("cnbc", item, i));
}

export async function fetchMarketWatch(symbol: string): Promise<SentimentMention[]> {
  const query = encodeURIComponent(symbol);
  const url = `https://www.marketwatch.com/rss/search?q=${query}`;
  const items = await fetchRss(url, UA);
  return items.slice(0, 15).map((item, i) => toMention("marketwatch", item, i));
}

interface FinnhubNewsItem {
  headline: string;
  summary: string;
  url: string;
  datetime: number;
  source: string;
}

export async function fetchFinnhubNews(symbol: string): Promise<SentimentMention[]> {
  const token = process.env.FINNHUB_API_KEY;
  if (!token) return [];

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  const url = `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${fromStr}&to=${toStr}&token=${token}`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];

  const data = (await res.json()) as FinnhubNewsItem[];
  return data.slice(0, 20).map((item, i) => {
    const text = `${item.headline} ${item.summary}`;
    const score = scoreText(text);
    return {
      id: `finnhub-${i}-${item.datetime}`,
      source: "finnhub" as const,
      title: item.headline,
      summary: item.summary,
      url: item.url,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      score,
      label: labelFromScore(score),
    };
  });
}
