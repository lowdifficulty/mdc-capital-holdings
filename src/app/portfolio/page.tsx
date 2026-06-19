import type { Metadata } from "next";
import Hero from "@/components/Hero";
import SectionHeading from "@/components/SectionHeading";
import PortfolioCard from "@/components/PortfolioCard";
import OperatingCapabilityCard from "@/components/OperatingCapabilityCard";
import CTASection from "@/components/CTASection";
import { operatingCapabilities, portfolioCompanies } from "@/data/site";

export const metadata: Metadata = {
  title: "Portfolio | MDC Capital Holdings",
  description:
    "Companies MDC Capital Holdings is building for the long term and the operating platform that supports their growth.",
};

export default function PortfolioPage() {
  return (
    <>
      <Hero
        compact
        headline="Companies we are building for the long term."
        body="Our portfolio reflects the MDC operating philosophy: enter markets with real demand, build strong systems, improve customer experience, and create durable value over time."
      />

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading headline="Portfolio" />
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {portfolioCompanies.map((company) => (
              <PortfolioCard key={company.id} company={company} variant="grid" />
            ))}
          </div>
        </div>
      </section>

      <section id="operating-platform" className="scroll-mt-28 bg-light-gray py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            eyebrow="Operating Platform"
            headline="Capital is only one part of the equation."
            body="MDC Capital Holdings is built around operating leverage. We help companies grow by improving the systems that create revenue, retention, and execution. Our support is practical, hands-on, and designed for small businesses that need more than advice."
          />
          <div className="mt-14">
            <SectionHeading
              eyebrow="Operating Capabilities"
              headline="Practical support across the systems that drive growth."
              body="Our operating platform is designed for small businesses that need execution, not just advice. We match our involvement to each company's stage, opportunity, and needs."
            />
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {operatingCapabilities.map((capability, index) => (
              <OperatingCapabilityCard
                key={capability.title}
                title={capability.title}
                body={capability.body}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy py-24 text-white md:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="font-serif text-3xl tracking-tight md:text-5xl">
            Operator-led support for real businesses
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-white/70">
            We combine marketing infrastructure, technology, systems design, and
            hands-on leadership to help companies become more durable, more scalable,
            and more valuable over time.
          </p>
        </div>
      </section>

      <CTASection
        headline="Building something in one of these sectors?"
        body="MDC partners with founders and operators who want long-term support across marketing, technology, operations, and growth."
        primaryLabel="Partner With Us"
        primaryHref="/contact"
        secondaryLabel="Explore Our Strategy"
        secondaryHref="/strategy"
      />
    </>
  );
}
