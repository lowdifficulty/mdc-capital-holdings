import "server-only";

const GRAPH = "https://graph.facebook.com/v21.0";

export function getMetaAppConfig() {
  const appId = process.env.META_APP_ID?.trim() ?? process.env.NEXT_PUBLIC_META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN?.trim();
  return { appId, appSecret, verifyToken };
}

export function isMetaConfigured(): boolean {
  const { appId, appSecret } = getMetaAppConfig();
  return Boolean(appId && appSecret);
}

export function metaOAuthRedirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/meta/oauth/callback`;
}

export function buildMetaOAuthUrl(origin: string): string | null {
  const { appId } = getMetaAppConfig();
  if (!appId) return null;
  const redirect = encodeURIComponent(metaOAuthRedirectUri(origin));
  const scope = encodeURIComponent(
    "pages_show_list,pages_messaging,pages_manage_metadata,instagram_basic,instagram_manage_messages",
  );
  return `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirect}&scope=${scope}&response_type=code`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const { appId, appSecret } = getMetaAppConfig();
  if (!appId || !appSecret) throw new Error("Meta app not configured");
  const url = `${GRAPH}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`;
  const res = await fetch(url);
  const json = (await res.json()) as { access_token?: string; error?: { message: string } };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error?.message ?? "Meta token exchange failed");
  }
  return json.access_token;
}

export async function fetchMetaPages(userToken: string) {
  const res = await fetch(
    `${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userToken)}`,
  );
  const json = (await res.json()) as {
    data?: { id: string; name: string; access_token: string; instagram_business_account?: { id: string } }[];
    error?: { message: string };
  };
  if (!res.ok) throw new Error(json.error?.message ?? "Failed to list Meta pages");
  return json.data ?? [];
}

export async function sendMetaTextMessage(
  pageAccessToken: string,
  recipientPsid: string,
  text: string,
): Promise<{ message_id?: string }> {
  const res = await fetch(`${GRAPH}/me/messages?access_token=${encodeURIComponent(pageAccessToken)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientPsid },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });
  const json = (await res.json()) as { message_id?: string; error?: { message: string } };
  if (!res.ok) throw new Error(json.error?.message ?? "Meta send failed");
  return json;
}

export async function sendInstagramTextMessage(
  igUserId: string,
  pageAccessToken: string,
  recipientIgsid: string,
  text: string,
): Promise<{ message_id?: string }> {
  const res = await fetch(
    `${GRAPH}/${igUserId}/messages?access_token=${encodeURIComponent(pageAccessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientIgsid },
        message: { text },
      }),
    },
  );
  const json = (await res.json()) as { message_id?: string; error?: { message: string } };
  if (!res.ok) throw new Error(json.error?.message ?? "Instagram send failed");
  return json;
}
