import Link from "next/link";

interface CTASectionProps {
  eyebrow?: string;
  headline: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  dark?: boolean;
}

export default function CTASection({
  eyebrow,
  headline,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
  dark = false,
}: CTASectionProps) {
  return (
    <section
      className={`py-24 md:py-32 ${
        dark ? "bg-navy text-white" : "bg-soft-blue text-navy"
      }`}
    >
      <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
        {eyebrow && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-mdc-blue">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-3xl tracking-tight md:text-5xl">{headline}</h2>
        <p
          className={`mx-auto mt-6 max-w-2xl text-base leading-relaxed md:text-lg ${
            dark ? "text-white/70" : "text-slate"
          }`}
        >
          {body}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href={primaryHref}
            className="inline-flex rounded-full bg-mdc-blue px-8 py-4 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white hover:text-navy"
          >
            {primaryLabel}
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className={`inline-flex rounded-full border px-8 py-4 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                dark
                  ? "border-white/25 text-white hover:border-white"
                  : "border-navy/15 text-navy hover:border-mdc-blue hover:text-mdc-blue"
              }`}
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
