import type { SentimentMention } from "./types";
import { labelFromScore, scoreText } from "./lexicon";

interface NewsApiArticle {
  title: string;
  description?: string;
  url: string;
  publishedAt: string;
  source?: { name?: string };
}

interface NewsApiResponse {
  status?: string;
  articles?: NewsApiArticle[];
  message?: string;
}

/** Broader news coverage via NewsAPI.org (developer tier). */
export async function fetchNewsApi(symbol: string): Promise<SentimentMention[]> {
  const key = process.env.NEWS_API_KEY;
  if (!key) return [];

  const q = encodeURIComponent(`${symbol} stock OR ${symbol} shares`);
  const url = `https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=25&apiKey=${key}`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return [];

    const data = (await res.json()) as NewsApiResponse;
    if (data.status !== "ok" || !data.articles?.length) return [];

    return data.articles.map((article, i) => {
      const text = `${article.title} ${article.description ?? ""}`;
      const score = scoreText(text);
      return {
        id: `news_api-${i}-${article.publishedAt}`,
        source: "news_api" as const,
        title: article.title,
        summary: article.description?.slice(0, 280),
        url: article.url,
        publishedAt: article.publishedAt,
        score,
        label: labelFromScore(score),
        meta: { publisher: article.source?.name ?? "NewsAPI" },
      };
    });
  } catch {
    return [];
  }
}
