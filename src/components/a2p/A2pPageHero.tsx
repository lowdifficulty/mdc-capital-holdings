export default function A2pPageHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-14 lg:px-8">
        <h1 className="font-serif text-3xl tracking-tight text-slate-900 md:text-4xl">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">{description}</p>
      </div>
    </section>
  );
}
