import type { ReactNode } from "react";

export default function SitePageShell({ children }: { children: ReactNode }) {
  return <div className="site-wayne bg-[#050505] text-[#eae6dc]">{children}</div>;
}
