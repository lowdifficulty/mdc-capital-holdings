"use client";

import AysoPlayerCard from "@/components/dashboard/AysoPlayerCard";
import { AYSO_ORG, AYSO_PLAYERS } from "@/lib/wellness/aysoSoccer";

export default function CommunityPanel() {
  return (
    <div className="mt-6 max-w-2xl space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-mdc-blue">Community soccer</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{AYSO_ORG.name}</h2>
        <p className="mt-1 text-sm text-white/60">{AYSO_ORG.location}</p>
        <p className="mt-4 text-sm leading-relaxed text-white/70">
          David and Charles are registered for the {AYSO_ORG.season} {AYSO_ORG.program} season with{" "}
          {AYSO_ORG.name} in Newport Beach.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h3 className="text-base font-semibold text-white">Fall registrations</h3>
        <p className="mt-1 text-sm text-white/50">{AYSO_ORG.program}</p>
        <div className="mt-2">
          {AYSO_PLAYERS.map((player) => (
            <AysoPlayerCard key={player.id} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}
