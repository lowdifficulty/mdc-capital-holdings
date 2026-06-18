interface OperatingCapabilityCardProps {
  title: string;
  body: string;
  index: number;
}

export default function OperatingCapabilityCard({
  title,
  body,
  index,
}: OperatingCapabilityCardProps) {
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
