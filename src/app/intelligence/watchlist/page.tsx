import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import WatchlistPage from "@/components/intelligence/WatchlistPage";

export const metadata = {
  title: "Watchlist | MDC Capital Holdings",
  robots: { index: false, follow: false },
};

export default async function WatchlistRoute() {
  const session = await getSession();
  if (!session.user) redirect("/login");
  return <WatchlistPage />;
}
