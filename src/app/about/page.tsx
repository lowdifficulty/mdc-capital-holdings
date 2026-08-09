import type { Metadata } from "next";
import A2pPageHero from "@/components/a2p/A2pPageHero";
import BusinessContactCard from "@/components/a2p/BusinessContactCard";
import { companyLegal, formatBusinessAddress } from "@/data/site";

export const metadata: Metadata = {
  title: "About | MDC Capital Holdings",
  description:
    "About MDC Capital Holdings — legal entity, address, and how we operate as a holdings company.",
};

export default function AboutPage() {
  return (
    <>
      <A2pPageHero
        title="About MDC Capital Holdings"
        description={`${companyLegal.legalEntityName} builds, acquires, and operates businesses with a long-term mindset across healthcare, local services, digital health, and technology.`}
      />

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-6 space-y-8 text-base leading-relaxed text-slate-600 lg:px-8">
          <div>
            <h2 className="font-serif text-xl text-slate-900">Legal entity</h2>
            <p className="mt-3">
              <strong className="text-slate-800">{companyLegal.legalEntityName}</strong>
              <br />
              EIN {companyLegal.ein}
              <br />
              {formatBusinessAddress()}
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-slate-900">What we do</h2>
            <p className="mt-3">
              We provide capital, marketing infrastructure, technology, and hands-on operating
              support to portfolio companies and partners. Our team handles customer communication,
              scheduling, and follow-up—including optional SMS updates when customers opt in on our
              website or by texting START to {companyLegal.businessPhoneDisplay}.
            </p>
          </div>

          <BusinessContactCard />
        </div>
      </section>
    </>
  );
}
