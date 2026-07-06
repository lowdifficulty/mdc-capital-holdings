import Link from "next/link";

export default function WayneHero() {
  return (
    <section className="relative overflow-hidden bg-[#050505] pt-40 pb-28 text-[#eae6dc] md:pt-48 md:pb-36">
      <div className="pointer-events-none absolute inset-0 home-wayne-hero-texture" />
      <div className="pointer-events-none absolute inset-0 home-wayne-hero-gold-wash" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 home-wayne-hero-tech" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <p className="animate-fade-up mb-6 text-xs font-medium uppercase tracking-[0.35em] text-[#c9a227]/90">
          Established capital · Discreet operations
        </p>

        <h1 className="animate-fade-up-delay-1 max-w-4xl font-serif text-4xl leading-[1.08] tracking-tight text-[#f8f4ec] md:text-6xl lg:text-7xl">
          We build and grow small businesses for the long term.
        </h1>

        <p className="animate-fade-up-delay-2 mt-8 max-w-2xl text-lg leading-relaxed text-[#eae6dc]/75 md:text-xl">
          MDC Capital Holdings is an operating holdings company focused on building, acquiring, and
          scaling durable businesses across healthcare, local services, digital platforms, and
          technology.
        </p>

        <div className="animate-fade-up-delay-3 mt-10 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="inline-flex rounded-sm border border-[#c9a227]/60 bg-[#c9a227] px-8 py-4 text-sm font-semibold uppercase tracking-widest text-[#050505] transition-all hover:-translate-y-0.5 hover:bg-[#e0c56a] hover:shadow-[0_8px_32px_rgba(201,162,39,0.25)]"
          >
            Login
          </Link>
          <Link
            href="/contact"
            className="inline-flex rounded-sm border border-[#eae6dc]/25 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-[#eae6dc] transition-all hover:-translate-y-0.5 hover:border-[#c9a227]/50 hover:text-[#c9a227]"
          >
            Contact us
          </Link>
        </div>

        <p className="mt-12 max-w-3xl border-t border-[#c9a227]/15 pt-8 text-base leading-relaxed text-[#eae6dc]/55 md:text-lg">
          We combine capital, operational execution, marketing infrastructure, technology, and
          founder-level focus to help companies grow beyond the limits of traditional small business
          ownership.
        </p>
      </div>
    </section>
  );
}
