import Link from "next/link";

interface HeroProps {
  eyebrow?: string;
  headline: string;
  body?: string;
  supportingLine?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  dark?: boolean;
  compact?: boolean;
  luxury?: boolean;
}

export default function Hero({
  eyebrow,
  headline,
  body,
  supportingLine,
  primaryCta,
  secondaryCta,
  dark = true,
  compact = false,
  luxury = false,
}: HeroProps) {
  const useLuxury = luxury || dark;

  return (
    <section
      className={`relative overflow-hidden ${
        useLuxury
          ? "bg-[#050505] text-[#eae6dc]"
          : dark
            ? "bg-navy text-white"
            : "bg-light-gray text-dark-text"
      } ${compact ? "pt-36 pb-20" : "pt-40 pb-28 md:pt-48 md:pb-36"}`}
    >
      {useLuxury ? (
        <>
          <div className="pointer-events-none absolute inset-0 site-wayne-hero-texture" />
          <div className="pointer-events-none absolute inset-0 site-wayne-hero-gold-wash" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 site-wayne-hero-tech" />
        </>
      ) : (
        dark && (
          <>
            <div className="pointer-events-none absolute inset-0 hero-blue-glow" />
            <div className="pointer-events-none absolute inset-0 hero-blue-mesh" />
            <div className="pointer-events-none absolute inset-0 hero-blue-grain" />
            <div className="pointer-events-none absolute inset-0 hero-noise" />
            <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-mdc-blue/10 blur-3xl" />
          </>
        )
      )}

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {eyebrow && (
          <p
            className={`animate-fade-up mb-6 text-xs font-medium uppercase tracking-[0.35em] ${
              useLuxury ? "text-[#c9a227]/90" : "font-semibold tracking-[0.2em] text-mdc-blue"
            }`}
          >
            {eyebrow}
          </p>
        )}

        <h1
          className={`animate-fade-up-delay-1 max-w-4xl font-serif tracking-tight ${
            compact
              ? "text-4xl leading-[1.1] md:text-5xl"
              : "text-4xl leading-[1.08] md:text-6xl lg:text-7xl"
          } ${
            useLuxury
              ? "text-[#f8f4ec]"
              : dark
                ? "text-white"
                : "text-navy"
          }`}
        >
          {headline}
        </h1>

        {body && (
          <p
            className={`animate-fade-up-delay-2 mt-8 max-w-2xl text-lg leading-relaxed md:text-xl ${
              useLuxury ? "text-[#eae6dc]/75" : dark ? "text-white/75" : "text-slate"
            }`}
          >
            {body}
          </p>
        )}

        {(primaryCta || secondaryCta) && (
          <div className="animate-fade-up-delay-3 mt-10 flex flex-wrap gap-4">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className={
                  useLuxury
                    ? "inline-flex rounded-sm border border-[#c9a227]/60 bg-[#c9a227] px-8 py-4 text-sm font-semibold uppercase tracking-widest text-[#050505] transition-all hover:-translate-y-0.5 hover:bg-[#e0c56a] hover:shadow-[0_8px_32px_rgba(201,162,39,0.25)]"
                    : "inline-flex rounded-full bg-mdc-blue px-8 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white hover:text-navy hover:shadow-lg"
                }
              >
                {primaryCta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className={`inline-flex rounded-sm border px-8 py-4 text-sm font-semibold uppercase tracking-widest transition-all hover:-translate-y-0.5 ${
                  useLuxury
                    ? "border-[#eae6dc]/25 text-[#eae6dc] hover:border-[#c9a227]/50 hover:text-[#c9a227]"
                    : dark
                      ? "rounded-full border-white/25 text-white hover:border-white hover:bg-white/10"
                      : "rounded-full border-navy/20 text-navy hover:border-mdc-blue hover:text-mdc-blue"
                }`}
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}

        {supportingLine && (
          <p
            className={`mt-12 max-w-3xl border-t pt-8 text-base leading-relaxed md:text-lg ${
              useLuxury
                ? "border-[#c9a227]/15 text-[#eae6dc]/55"
                : dark
                  ? "border-white/10 text-white/60"
                  : "border-navy/10 text-slate"
            }`}
          >
            {supportingLine}
          </p>
        )}
      </div>
    </section>
  );
}
