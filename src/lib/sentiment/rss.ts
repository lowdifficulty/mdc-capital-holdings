export interface RssItem {
  title: string;
  link?: string;
  pubDate?: string;
  description?: string;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1];
    if (!title) continue;

    items.push({
      title: decodeEntities(title),
      link: block.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim(),
      pubDate: block
        .match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]
        ?.trim(),
      description: decodeEntities(
        block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] ??
          ""
      ),
    });
  }

  return items;
}

export async function fetchRss(url: string, userAgent: string): Promise<RssItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": userAgent },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  return parseRssItems(xml);
}
