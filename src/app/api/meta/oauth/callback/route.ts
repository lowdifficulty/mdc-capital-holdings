import { redirect } from "next/navigation";
import {
  exchangeCodeForToken,
  fetchMetaPages,
  metaOAuthRedirectUri,
} from "@/lib/meta/client";
import { saveMetaIntegration } from "@/lib/platform/store";
import { requireUser } from "@/lib/auth/session";

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch {
    redirect("/login");
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = new URL(request.url).origin;

  if (!code) {
    redirect("/dashboard/integrations?meta=error");
  }

  try {
    const redirectUri = metaOAuthRedirectUri(origin);
    const userToken = await exchangeCodeForToken(code, redirectUri);
    const pages = await fetchMetaPages(userToken);
    const page = pages[0];
    if (!page) {
      redirect("/dashboard/integrations?meta=no_page");
    }

    await saveMetaIntegration({
      connected: true,
      pageId: page.id,
      pageName: page.name,
      igUserId: page.instagram_business_account?.id ?? null,
      connectedAt: new Date().toISOString(),
      userAccessToken: userToken,
      pageAccessToken: page.access_token,
    });

    redirect("/dashboard/integrations?meta=connected");
  } catch {
    redirect("/dashboard/integrations?meta=error");
  }
}
