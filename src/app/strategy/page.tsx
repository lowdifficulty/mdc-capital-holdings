import type { Metadata } from "next";
import Hero from "@/components/Hero";
import SectionHeading from "@/components/SectionHeading";
import SectionPhoto from "@/components/SectionPhoto";
import { whatWeLookFor, whatWeAvoid, siteImages } from "@/data/site";
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
        luxury
        headline="We invest where better operations can unlock better outcomes."
        body="MDC Capital Holdings focuses on small businesses and digital platforms where demand already exists but execution can be improved. We are especially interested in companies that benefit from stronger marketing, better systems, technology, automation, and disciplined operating leadership."
      />

      <section className="border-t border-[#c9a227]/10 bg-[#0a0a0a] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 grid gap-6 md:grid-cols-3">
            <SectionPhoto
              src={siteImages.healthcare}
              alt="Healthcare distribution and services"
              className="aspect-[4/3]"
              luxury
            />
            <SectionPhoto
              src={siteImages.homeServices}
              alt="Home and local service businesses"
              className="aspect-[4/3]"
              luxury
            />
            <SectionPhoto
              src={siteImages.startupTech}
              alt="Startup technology platforms"
              className="aspect-[4/3]"
              luxury
            />
          </div>
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading luxury headline="What we look for" />
              <ul className="mt-8 space-y-3">
                {whatWeLookFor.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-sm border border-[#c9a227]/12 bg-[#111] px-5 py-4 text-sm text-[#eae6dc]/75"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#c9a227]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeading luxury headline="What we avoid" />
              <ul className="mt-8 space-y-3">
                {whatWeAvoid.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-sm border border-[#c9a227]/10 bg-black/20 px-5 py-4 text-sm text-[#eae6dc]/65"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#eae6dc]/30" />
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
