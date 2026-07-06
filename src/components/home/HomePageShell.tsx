import type { ReactNode } from "react";

export default function HomePageShell({ children }: { children: ReactNode }) {
  return <div className="home-wayne bg-[#050505] text-[#eae6dc]">{children}</div>;
}
