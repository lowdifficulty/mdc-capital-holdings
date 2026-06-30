const UA = "MDC-Capital-Sentiment/1.0";
const SESSION_TTL_MS = 10 * 60 * 1000;

interface YahooSession {
  cookie: string;
  crumb: string;
  expiresAt: number;
}

let cachedSession: YahooSession | null = null;

function isValidCrumb(crumb: string): boolean {
  if (!crumb || crumb.length > 32) return false;
  if (/too many/i.test(crumb)) return false;
  return /^[\w@.-]+$/.test(crumb);
}

export async function getYahooSession(): Promise<{ cookie: string; crumb: string } | null> {
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return { cookie: cachedSession.cookie, crumb: cachedSession.crumb };
  }

  try {
    const fcRes = await fetch("https://fc.yahoo.com", {
      headers: { "User-Agent": UA },
      redirect: "manual",
      next: { revalidate: 0 },
    });

    const setCookies =
      typeof fcRes.headers.getSetCookie === "function"
        ? fcRes.headers.getSetCookie()
        : [];
    const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
    if (!cookie) return null;

    let crumb = "";
    try {
      const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
        headers: { "User-Agent": UA, Cookie: cookie },
        next: { revalidate: 0 },
      });
      if (crumbRes.ok) {
        const text = (await crumbRes.text()).trim();
        if (isValidCrumb(text)) crumb = text;
      }
    } catch {
      /* chart endpoints work with cookie alone */
    }

    cachedSession = {
      cookie,
      crumb,
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    return { cookie, crumb };
  } catch {
    return null;
  }
}

function withCrumb(url: string, crumb: string): string {
  if (!crumb) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}crumb=${encodeURIComponent(crumb)}`;
}

async function fetchYahooAuthenticated(url: string): Promise<Response | null> {
  const session = await getYahooSession();
  if (!session) return null;

  try {
    const res = await fetch(withCrumb(url, session.crumb), {
      headers: { "User-Agent": UA, Cookie: session.cookie },
      next: { revalidate: 0 },
    });
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

/** Yahoo v8 chart API — requires cookie session (bare requests get HTTP 429). */
export async function fetchYahooChartData(
  symbol: string,
  params: Record<string, string>
): Promise<unknown | null> {
  const qs = new URLSearchParams(params).toString();
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${qs}`;
  const res = await fetchYahooAuthenticated(url);
  if (!res) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchYahooJson<T>(url: string): Promise<T | null> {
  const res = await fetchYahooAuthenticated(url);
  if (!res) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
