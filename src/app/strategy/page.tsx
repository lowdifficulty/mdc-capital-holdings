import type { Metadata } from "next";
import Hero from "@/components/Hero";
import SectionHeading from "@/components/SectionHeading";
import StrategyCard from "@/components/StrategyCard";
import SectionPhoto from "@/components/SectionPhoto";
import {
  investmentThemes,
  whatWeLookFor,
  whatWeAvoid,
  siteImages,
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
              <StrategyCard
                key={theme.title}
                title={theme.title}
                body={theme.body}
                imageSrc={theme.imageSrc}
                imageAlt={theme.imageAlt}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-light-gray py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            <SectionPhoto
              src={siteImages.healthcare}
              alt="Healthcare distribution and services"
              className="aspect-[4/3]"
            />
            <SectionPhoto
              src={siteImages.homeServices}
              alt="Home and local service businesses"
              className="aspect-[4/3]"
            />
            <SectionPhoto
              src={siteImages.startupTech}
              alt="Startup technology platforms"
              className="aspect-[4/3]"
            />
          </div>
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
    </>
  );
}
