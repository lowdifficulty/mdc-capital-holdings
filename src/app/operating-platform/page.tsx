import type { Metadata } from "next";
import Hero from "@/components/Hero";
import SectionHeading from "@/components/SectionHeading";
import OperatingCapabilityCard from "@/components/OperatingCapabilityCard";
import CTASection from "@/components/CTASection";
import { operatingCapabilities } from "@/data/site";

export const metadata: Metadata = {
  title: "Operating Platform | MDC Capital Holdings",
  description:
    "MDC Capital Holdings provides hands-on operating support across marketing, sales, technology, operations, brand, and finance.",
};

export default function OperatingPlatformPage() {
  return (
    <>
      <Hero
        compact
        headline="Capital is only one part of the equation."
        body="MDC Capital Holdings is built around operating leverage. We help companies grow by improving the systems that create revenue, retention, and execution. Our support is practical, hands-on, and designed for small businesses that need more than advice."
      />

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            eyebrow="Operating Capabilities"
            headline="Practical support across the systems that drive growth."
            body="Our operating platform is designed for small businesses that need execution, not just advice. We match our involvement to each company's stage, opportunity, and needs."
          />
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
        headline="See how our operating platform can help."
        body="Whether you need better marketing, stronger systems, or hands-on leadership, MDC brings practical operating support to businesses with real customer demand."
        primaryLabel="Partner With Us"
        primaryHref="/contact"
        secondaryLabel="View Our Strategy"
        secondaryHref="/strategy"
      />
    </>
  );
}
