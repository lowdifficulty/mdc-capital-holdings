import Hero from "@/components/Hero";
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
      <Hero
        headline="We build and grow small businesses for the long term."
        body="MDC Capital Holdings is an operating holdings company focused on building, acquiring, and scaling durable businesses across healthcare, local services, digital platforms, and technology."
        supportingLine="We combine capital, operational execution, marketing infrastructure, technology, and founder-level focus to help companies grow beyond the limits of traditional small business ownership."
      />

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center gap-12">
            <SectionHeading
              align="center"
              headlineSingleLine
              eyebrow="Permanent Operating Capital"
              headline="Our long-term outlook sets us apart."
              body="MDC Capital Holdings was built for operators, founders, and small business owners who care about what happens after the transaction. We are not short-term financial buyers. We are builders. We invest our time, systems, capital, and operating experience into businesses we believe can compound over years.

We look for companies with real customer demand, strong service models, operational upside, and room to scale through better marketing, technology, systems, and leadership."
            />
            <SectionPhoto
              src={siteImages.operations}
              alt="Wooden house models and growing stacks of coins representing long-term capital and durable growth"
              className="aspect-[21/9] w-full max-w-5xl"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </div>
      </section>

      <section className="bg-light-gray py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            align="center"
            headline="We help companies grow with hands-on operating support."
            body="No two companies are alike. MDC Capital Holdings works across a focused group of operating businesses and digital platforms, matching our involvement to each company's stage, opportunity, and needs."
          />
          <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
            {whatWeDoCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-navy/8 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:border-mdc-blue/25 hover:shadow-lg"
              >
                <h3 className="font-serif text-2xl text-navy">{card.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-slate">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SituationsSection />

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
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
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy py-24 text-white md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeading
            eyebrow="How We Create Value"
            headline="Capital is only one part of the equation."
            body="MDC Capital Holdings is built around operating leverage. We help companies grow by improving the systems that create revenue, retention, and execution. Our support is practical, hands-on, and designed for small businesses that need more than advice."
            light
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

      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <SectionHeading
                headline="We invest where better operations can unlock better outcomes."
                body="MDC Capital Holdings focuses on small businesses and digital platforms where demand already exists but execution can be improved."
              />
              <p className="mb-4 mt-8 text-xs font-semibold uppercase tracking-widest text-mdc-blue">
                What we look for
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {whatWeLookFor.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-lg bg-light-gray px-4 py-3 text-sm text-slate"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-mdc-blue" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <SectionPhoto
                src={siteImages.healthcare}
                alt="Healthcare distribution and medical services"
                className="aspect-square sm:col-span-2 sm:aspect-[21/9]"
              />
              <SectionPhoto
                src={siteImages.homeServices}
                alt="Home and local service businesses"
                className="aspect-square"
              />
              <SectionPhoto
                src={siteImages.startupTech}
                alt="Startup technology and digital platforms"
                className="aspect-square"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
