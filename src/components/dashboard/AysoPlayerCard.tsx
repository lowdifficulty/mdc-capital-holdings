import type { AysPlayerRegistration } from "@/lib/wellness/aysoSoccer";

export default function AysoPlayerCard({ player }: { player: AysPlayerRegistration }) {
  return (
    <article className="flex gap-4 border-b border-white/10 py-5 last:border-b-0">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-mdc-blue text-sm font-bold text-white">
        {player.initials}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-white">{player.name}</h3>
        <p className="mt-1 text-sm text-white/50">D.O.B: {player.dateOfBirth}</p>
        {player.idNumber && (
          <p className="mt-0.5 text-sm text-white/50">ID Number: {player.idNumber}</p>
        )}
        <p className="mt-2 text-sm font-medium text-mdc-blue">
          {player.program} | {player.division}
        </p>
      </div>
    </article>
  );
}
