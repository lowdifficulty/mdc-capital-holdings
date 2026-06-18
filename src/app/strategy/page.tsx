import type { Metadata } from "next";
import Hero from "@/components/Hero";
import SectionHeading from "@/components/SectionHeading";
import StrategyCard from "@/components/StrategyCard";
import CTASection from "@/components/CTASection";
import {
  investmentThemes,
  whatWeLookFor,
  whatWeAvoid,
} from "@/data/site";

export const metadata: Metadata = {
  title: "Our Strategy | MDC Capital Holdings",
  description:
    "MDC Capital Holdings focuses on small businesses and digital platforms where better operations, marketing, and technology can unlock durable growth.",
};

export default function StrategyPage() {
  return (
    <>
      <Hero
        compact
        headline="We invest where better operations can unlock better outcomes."
        body="MDC Capital Holdings focuses on small businesses and digital platforms where demand already exists but execution can be improved. We are especially interested in companies that benefit from stronger marketing, better systems, technology, automation, and disciplined operating leadership."
      />

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            eyebrow="Investment Themes"
            headline="Focused sectors where operating leverage matters."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {investmentThemes.map((theme) => (
              <StrategyCard key={theme.title} title={theme.title} body={theme.body} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-light-gray py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading headline="What we look for" />
              <ul className="mt-8 space-y-3">
                {whatWeLookFor.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-lg bg-white px-5 py-4 text-sm text-slate shadow-sm"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-mdc-blue" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeading headline="What we avoid" />
              <ul className="mt-8 space-y-3">
                {whatWeAvoid.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-lg border border-navy/8 bg-white px-5 py-4 text-sm text-slate"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate/40" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        headline="Ready to explore a partnership?"
        body="We are especially interested in businesses where our operating platform can create value through better marketing, technology, systems, and strategic growth."
        primaryLabel="Partner With Us"
        primaryHref="/contact"
        secondaryLabel="View Our Portfolio"
        secondaryHref="/portfolio"
      />
    </>
  );
}
