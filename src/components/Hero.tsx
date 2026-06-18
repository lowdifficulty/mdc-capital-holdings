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
}: HeroProps) {
  return (
    <section
      className={`relative overflow-hidden ${
        dark ? "bg-navy text-white" : "bg-light-gray text-dark-text"
      } ${compact ? "pt-36 pb-20" : "pt-40 pb-28 md:pt-48 md:pb-36"}`}
    >
      {dark && (
        <>
          <div className="pointer-events-none absolute inset-0 hero-blue-glow" />
          <div className="pointer-events-none absolute inset-0 hero-blue-mesh" />
          <div className="pointer-events-none absolute inset-0 hero-blue-grain" />
          <div className="pointer-events-none absolute inset-0 hero-noise" />
          <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-mdc-blue/10 blur-3xl" />
        </>
      )}

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {eyebrow && (
          <p className="animate-fade-up mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-mdc-blue">
            {eyebrow}
          </p>
        )}

        <h1
          className={`animate-fade-up-delay-1 max-w-4xl font-serif text-4xl leading-[1.1] tracking-tight md:text-6xl lg:text-7xl ${
            dark ? "text-white" : "text-navy"
          }`}
        >
          {headline}
        </h1>

        {body && (
          <p
            className={`animate-fade-up-delay-2 mt-8 max-w-2xl text-lg leading-relaxed md:text-xl ${
              dark ? "text-white/75" : "text-slate"
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
                className="inline-flex rounded-full bg-mdc-blue px-8 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white hover:text-navy hover:shadow-lg"
              >
                {primaryCta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className={`inline-flex rounded-full border px-8 py-4 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                  dark
                    ? "border-white/25 text-white hover:border-white hover:bg-white/10"
                    : "border-navy/20 text-navy hover:border-mdc-blue hover:text-mdc-blue"
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
              dark
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
