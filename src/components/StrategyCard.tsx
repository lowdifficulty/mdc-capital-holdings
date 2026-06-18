interface StrategyCardProps {
  title: string;
  body: string;
}

export default function StrategyCard({ title, body }: StrategyCardProps) {
  return (
    <article className="rounded-2xl border border-navy/8 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-mdc-blue/25 hover:shadow-lg">
      <h3 className="font-serif text-xl text-navy md:text-2xl">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-slate">{body}</p>
    </article>
  );
}
