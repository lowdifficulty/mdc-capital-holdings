import WayneHero from "@/components/home/WayneHero";
import SectionHeading from "@/components/SectionHeading";
import PortfolioCard from "@/components/PortfolioCard";
import OperatingCapabilityCard from "@/components/OperatingCapabilityCard";
import SituationsSection from "@/components/SituationsSection";
import {
  portfolioCompanies,
  whatWeDoCards,
  operatingCapabilities,
  whatWeLookFor,
  siteImages,
} from "@/data/site";
import SectionPhoto from "@/components/SectionPhoto";

export default function HomePage() {
  return (
    <>
      <WayneHero />

      <section className="border-t border-[#c9a227]/10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center gap-12">
            <SectionHeading
              align="center"
              headlineSingleLine
              luxury
              eyebrow="Permanent Operating Capital"
              headline="Our long-term outlook sets us apart."
              body="MDC Capital Holdings was built for operators, founders, and small business owners who care about what happens after the transaction. We are not short-term financial buyers. We are builders. We invest our time, systems, capital, and operating experience into businesses we believe can compound over years.

We look for companies with real customer demand, strong service models, operational upside, and room to scale through better marketing, technology, systems, and leadership."
            />
            <SectionPhoto
              src={siteImages.operations}
              alt="Black and gold miniature house models with growing stacks of gold coins on marble, representing long-term capital and durable growth"
              className="w-full max-w-5xl opacity-90 ring-1 ring-[#c9a227]/15"
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
          <SectionHeading
            align="center"
            luxury
            headline="We help companies grow with hands-on operating support."
            body="No two companies are alike. MDC Capital Holdings works across a focused group of operating businesses and digital platforms, matching our involvement to each company's stage, opportunity, and needs."
          />
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
            {whatWeDoCards.map((card) => (
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

      <SituationsSection luxury />

      <section className="border-t border-[#c9a227]/10 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            luxury
            eyebrow="Our Companies"
            headline="A focused portfolio of operating businesses and digital platforms."
            body="MDC Capital Holdings invests in and operates companies across healthcare, pet services, digital health, and music technology. Each company is different, but the strategy is consistent: find real demand, improve execution, build systems, and compound value over time."
          />
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {portfolioCompanies.map((company) => (
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
            eyebrow="How We Create Value"
            headline="Capital is only one part of the equation."
            body="MDC Capital Holdings is built around operating leverage. We help companies grow by improving the systems that create revenue, retention, and execution. Our support is practical, hands-on, and designed for small businesses that need more than advice."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {operatingCapabilities.map((capability, index) => (
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
                headline="We invest where better operations can unlock better outcomes."
                body="MDC Capital Holdings focuses on small businesses and digital platforms where demand already exists but execution can be improved."
              />
              <p className="mb-4 mt-8 text-xs font-semibold uppercase tracking-widest text-[#c9a227]">
                What we look for
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {whatWeLookFor.map((item) => (
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
