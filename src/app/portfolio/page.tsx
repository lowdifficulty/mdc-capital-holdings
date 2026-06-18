import type { Metadata } from "next";
import Hero from "@/components/Hero";
import PortfolioCard from "@/components/PortfolioCard";
import CTASection from "@/components/CTASection";
import { portfolioCompanies } from "@/data/site";

export const metadata: Metadata = {
  title: "Portfolio | MDC Capital Holdings",
  description:
    "Companies MDC Capital Holdings is building for the long term across healthcare, local services, digital health, and music technology.",
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
          <div className="grid gap-8 md:grid-cols-2">
            {portfolioCompanies.map((company) => (
              <PortfolioCard key={company.id} company={company} variant="grid" />
            ))}
          </div>
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
