import type { Metadata } from "next";
import Link from "next/link";
import WayneHero2 from "@/components/home/WayneHero2";
import SectionHeading from "@/components/SectionHeading";
import PortfolioCard from "@/components/PortfolioCard";
import OperatingCapabilityCard from "@/components/OperatingCapabilityCard";
import SituationsSection from "@/components/SituationsSection";
import SectionPhoto from "@/components/SectionPhoto";
import { portfolioCompanies, siteImages } from "@/data/site";
import {
  home2CommandCenter,
  home2CommandCenterValueProps,
  home2Intro,
  home2PermanentCapital,
  home2Portfolio,
  home2PortfolioCompanies,
  home2Situations,
  home2Strategy,
  home2WhatWeDo,
  home2WhatWeDoCards,
  home2WhatWeLookFor,
} from "@/data/home2";

export const metadata: Metadata = {
  title: "Home 2 | MDC Capital Holdings",
  description:
    "From small business to global enterprise. MDC Capital Holdings builds, acquires, and scales operating businesses through capital, technology, and command-center execution.",
};

export default function Home2Page() {
  const companies = home2PortfolioCompanies(portfolioCompanies);

  return (
    <>
      <WayneHero2 />

      <section className="border-t border-[#c9a227]/10 bg-[#0a0a0a] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            align="center"
            luxury
            headline={home2Intro.headline}
            body={home2Intro.body}
          />
        </div>
      </section>

      <section className="border-t border-[#c9a227]/10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex w-full min-w-0 flex-col items-center gap-12">
            <SectionHeading
              align="center"
              luxury
              eyebrow={home2PermanentCapital.eyebrow}
              headline={home2PermanentCapital.headline}
              body={home2PermanentCapital.body}
            />
            <SectionPhoto
              src={siteImages.operations}
              alt="Black and gold miniature house models with growing stacks of gold coins on marble, representing long-term capital and durable growth"
              className="w-full min-w-0 max-w-5xl opacity-90 ring-1 ring-[#c9a227]/15"
              sizes="(max-width: 1024px) 100vw, 1024px"
              luxury
              fit="contain"
              width={1024}
              height={410}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-[#c9a227]/10 bg-[#0a0a0a] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading align="center" luxury headline={home2WhatWeDo.headline} />
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
            {home2WhatWeDoCards.map((card) => (
              <article
                key={card.title}
                className="rounded-sm border border-[#c9a227]/15 bg-[#111] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a227]/35 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
              >
                <h3 className="font-serif text-2xl text-[#f8f4ec]">{card.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#eae6dc]/65">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SituationsSection
        luxury
        headline="MDC partners with businesses at the moment everything changes."
        body="The right business, at the right moment, does not need more noise. It needs command. MDC works with founders, owners, and operators facing the moments that define the future of a company."
        situations={home2Situations}
        panelLabel="How MDC responds"
      />

      <section className="border-t border-[#c9a227]/10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            luxury
            headline={home2Portfolio.headline}
            body={home2Portfolio.body}
          />
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {companies.map((company) => (
              <PortfolioCard
                key={company.id}
                company={company}
                variant="detailed"
                imageClassName="h-[27.5rem]"
                luxury
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#c9a227]/10 bg-[#080808] py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            luxury
            light
            eyebrow={home2CommandCenter.eyebrow}
            headline={home2CommandCenter.headline}
            body={home2CommandCenter.body}
          />
          <div className="mt-10 flex flex-col items-start justify-between gap-6 rounded-sm border border-[#c9a227]/20 bg-[#111] p-8 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#c9a227]">
                MDC Command Center
              </p>
              <p className="mt-2 font-serif text-3xl text-[#f8f4ec]">$49 per month</p>
              <p className="mt-2 text-sm text-[#eae6dc]/60">
                Private operating dashboard for serious builders.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex shrink-0 rounded-sm border border-[#c9a227]/60 bg-[#c9a227] px-8 py-4 text-sm font-semibold uppercase tracking-widest text-[#050505] transition-all hover:-translate-y-0.5 hover:bg-[#e0c56a]"
            >
              Apply for Command Center Access
            </Link>
          </div>
          <div className="mt-16">
            <h3 className="font-serif text-2xl text-[#f8f4ec] md:text-3xl">
              {home2CommandCenter.valuePropsHeadline}
            </h3>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {home2CommandCenterValueProps.map((capability, index) => (
              <OperatingCapabilityCard
                key={capability.title}
                title={capability.title}
                body={capability.body}
                index={index}
                luxury
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#c9a227]/10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <SectionHeading
                luxury
                headline={home2Strategy.headline}
                body={home2Strategy.body}
              />
              <p className="mb-4 mt-8 text-xs font-semibold uppercase tracking-widest text-[#c9a227]">
                What we look for
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {home2WhatWeLookFor.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-sm border border-[#c9a227]/10 bg-[#111] px-4 py-3 text-sm text-[#eae6dc]/75"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9a227]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <SectionPhoto
                src={siteImages.healthcare}
                alt="Surgical team overhead view in a gold-lit operating room"
                className="aspect-square opacity-90 ring-1 ring-[#c9a227]/15 sm:col-span-2 sm:aspect-[21/9]"
                luxury
              />
              <SectionPhoto
                src={siteImages.homeServices}
                alt="Dog at night with city lights — local pet services"
                className="aspect-square opacity-90 ring-1 ring-[#c9a227]/15"
                luxury
              />
              <SectionPhoto
                src={siteImages.startupTech}
                alt="Technology team collaborating in a gold-lit workspace"
                className="aspect-square opacity-90 ring-1 ring-[#c9a227]/15"
                luxury
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
