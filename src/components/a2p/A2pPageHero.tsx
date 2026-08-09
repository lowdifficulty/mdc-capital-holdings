export default function A2pPageHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="a2p-hero relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute inset-0 hero-noise" />
      <div className="pointer-events-none absolute inset-0 hero-blue-glow opacity-80" />
      <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
        <h1 className="font-serif text-3xl tracking-tight text-white md:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/80 md:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}
