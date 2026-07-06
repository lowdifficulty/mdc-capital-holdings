"use client";

import AysoPlayerCard from "@/components/dashboard/AysoPlayerCard";
import { AYSO_ORG, AYSO_PLAYERS } from "@/lib/wellness/aysoSoccer";

export default function FamilyPanel() {
  return (
    <div className="mt-6 max-w-2xl">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Players</h2>
        <p className="mt-1 text-sm text-white/50">
          {AYSO_ORG.season} · {AYSO_ORG.name} soccer · {AYSO_ORG.location}
        </p>
        <div className="mt-2">
          {AYSO_PLAYERS.map((player) => (
            <AysoPlayerCard key={player.id} player={player} />
          ))}
        </div>
      </div>
    </div>
  );
}
