const UA = "MDC-Capital-Sentiment/1.0";

export async function getYahooSession(): Promise<{ cookie: string; crumb: string } | null> {
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

    const crumbRes = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
      headers: { "User-Agent": UA, Cookie: cookie },
      next: { revalidate: 0 },
    });
    if (!crumbRes.ok) return null;

    const crumb = (await crumbRes.text()).trim();
    if (!crumb) return null;

    return { cookie, crumb };
  } catch {
    return null;
  }
}

export async function fetchYahooJson<T>(url: string): Promise<T | null> {
  const session = await getYahooSession();
  if (!session) return null;

  const sep = url.includes("?") ? "&" : "?";
  const fullUrl = `${url}${sep}crumb=${encodeURIComponent(session.crumb)}`;

  try {
    const res = await fetch(fullUrl, {
      headers: { "User-Agent": UA, Cookie: session.cookie },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
