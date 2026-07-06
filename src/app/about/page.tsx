import type { Metadata } from "next";
import Hero from "@/components/Hero";
import SectionHeading from "@/components/SectionHeading";
import SectionPhoto from "@/components/SectionPhoto";
import { principles, siteImages } from "@/data/site";

export const metadata: Metadata = {
  title: "About | MDC Capital Holdings",
  description:
    "MDC Capital Holdings is an operating holdings company built by operators who believe small businesses deserve long-term support, practical technology, and hands-on leadership.",
};

export default function AboutPage() {
  return (
    <>
      <Hero
        compact
        luxury
        headline="Operators first. Capital second."
        body="MDC Capital Holdings was created to build, acquire, and operate businesses with a long-term mindset. We believe many small businesses do not fail because the market is too small. They fail because the systems around the business are not strong enough yet."
      />

      <section className="border-t border-[#c9a227]/10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <SectionHeading
              luxury
              headline="Built for operators, founders, and owners who think long term."
            />
            <div className="space-y-8">
              <SectionPhoto
                src={siteImages.operations}
                alt="Leadership team planning long-term business growth"
                className="aspect-[16/10]"
                luxury
                fit="contain"
                width={1024}
                height={410}
              />
              <p className="text-base leading-relaxed text-[#eae6dc]/65 md:text-lg">
                MDC brings together business building, digital marketing, technology,
                finance, and hands-on operating experience. Our role is to help companies
                become more durable, more scalable, and more valuable without losing the
                practical customer focus that made them work in the first place.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#c9a227]/10 bg-[#0a0a0a] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            luxury
            eyebrow="Principles"
            headline="How we approach ownership and operating support."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {principles.map((principle) => (
              <article
                key={principle.title}
                className="rounded-sm border border-[#c9a227]/15 bg-[#111] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a227]/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
              >
                <h3 className="font-serif text-xl text-[#f8f4ec]">{principle.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#eae6dc]/65">
                  {principle.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#c9a227]/10 py-24 md:py-32">
        <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
          <p className="font-serif text-2xl leading-relaxed text-[#f8f4ec] md:text-3xl">
            MDC Capital Holdings is an operating holdings company that builds, acquires,
            and grows small businesses and digital platforms with a long-term ownership
            mindset.
          </p>
        </div>
      </section>
    </>
  );
}
