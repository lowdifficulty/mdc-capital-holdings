import Link from "next/link";

export default function WayneHero2() {
  return (
    <section className="relative overflow-hidden bg-[#050505] pt-40 pb-28 text-[#eae6dc] md:pt-48 md:pb-36">
      <div className="pointer-events-none absolute inset-0 home-wayne-hero-texture" />
      <div className="pointer-events-none absolute inset-0 home-wayne-hero-gold-wash" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 home-wayne-hero-tech" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <p className="animate-fade-up mb-6 text-xs font-medium uppercase tracking-[0.35em] text-[#c9a227]/90">
          Established Capital · Discreet Operations · Command Center Intelligence
        </p>

        <h1 className="animate-fade-up-delay-1 max-w-4xl font-serif text-4xl leading-[1.08] tracking-tight text-[#f8f4ec] md:text-6xl lg:text-7xl">
          From Small Business to Global Enterprise.
        </h1>

        <p className="animate-fade-up-delay-2 mt-8 max-w-3xl text-lg leading-relaxed text-[#eae6dc]/75 md:text-xl">
          MDC Capital Holdings builds, acquires, and scales operating businesses through capital,
          technology, marketing infrastructure, AI-enabled systems, and disciplined command-center
          execution.
        </p>

        <div className="animate-fade-up-delay-3 mt-10 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="inline-flex rounded-sm border border-[#c9a227]/60 bg-[#c9a227] px-8 py-4 text-sm font-semibold uppercase tracking-widest text-[#050505] transition-all hover:-translate-y-0.5 hover:bg-[#e0c56a] hover:shadow-[0_8px_32px_rgba(201,162,39,0.25)]"
          >
            Enter the Command Center
          </Link>
          <Link
            href="/contact"
            className="inline-flex rounded-sm border border-[#eae6dc]/25 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-[#eae6dc] transition-all hover:-translate-y-0.5 hover:border-[#c9a227]/50 hover:text-[#c9a227]"
          >
            Partner With MDC
          </Link>
        </div>

        <div className="mt-12 max-w-3xl space-y-6 border-t border-[#c9a227]/15 pt-8 text-base leading-relaxed text-[#eae6dc]/55 md:text-lg">
          <p>
            MDC Capital invests in real businesses, strengthens their operating infrastructure, and
            equips them with the systems, dashboards, automations, and leadership discipline required
            to move from small business execution to enterprise-level command.
          </p>
        </div>
      </div>
    </section>
  );
}
