interface OperatingCapabilityCardProps {
  title: string;
  body: string;
  index: number;
  luxury?: boolean;
}

export default function OperatingCapabilityCard({
  title,
  body,
  index,
  luxury = false,
}: OperatingCapabilityCardProps) {
  if (luxury) {
    return (
      <article className="group rounded-sm border border-[#c9a227]/12 bg-[#111]/90 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a227]/30 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-[#c9a227]/15 text-sm font-bold text-[#c9a227] transition-colors group-hover:bg-[#c9a227]/25">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="mt-6 font-serif text-xl text-[#f8f4ec]">{title}</h3>
        <p className="mt-4 text-sm leading-relaxed text-[#eae6dc]/60">{body}</p>
      </article>
    );
  }

  return (
    <article className="group rounded-2xl border border-navy/8 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-mdc-blue/25 hover:shadow-lg">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-soft-blue text-sm font-bold text-mdc-blue transition-colors group-hover:bg-mdc-blue group-hover:text-white">
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3 className="mt-6 font-serif text-xl text-navy">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-slate">{body}</p>
    </article>
  );
}
