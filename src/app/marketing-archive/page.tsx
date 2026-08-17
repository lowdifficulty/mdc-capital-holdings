import { redirect } from "next/navigation";

/** Archived path — homepage is the legacy Wayne site again. */
export default function MarketingArchivePage() {
  redirect("/");
}
