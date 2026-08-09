import type { Metadata } from "next";
import Link from "next/link";
import BusinessContactCard from "@/components/a2p/BusinessContactCard";
import A2pHomeHero, { A2pQuickLinks } from "@/components/a2p/A2pHomeHero";
import { companyLegal } from "@/data/site";

export const metadata: Metadata = {
  title: "MDC Capital Holdings | Business Information",
  description:
    "MDC Capital Holdings — operating holdings company. Contact, SMS program information, and business details for partners and customers.",
};

export default function HomePage() {
  return (
    <>
      <A2pHomeHero />
      <A2pQuickLinks />

      <section className="border-t border-navy/10 bg-white py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="font-serif text-2xl text-navy md:text-3xl">Business contact</h2>
              <p className="mt-3 leading-relaxed text-slate">
                Reach our team for partnerships, operating support, customer inquiries, and
                scheduling. Address and phone match our registered business profile.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate">
                <li>
                  <span className="font-semibold text-navy">Email: </span>
                  <a
                    href={`mailto:${companyLegal.contactEmail}`}
                    className="text-mdc-blue hover:text-navy"
                  >
                    {companyLegal.contactEmail}
                  </a>
                </li>
                <li>
                  <span className="font-semibold text-navy">Phone: </span>
                  <a
                    href={`tel:${companyLegal.businessPhone}`}
                    className="text-mdc-blue hover:text-navy"
                  >
                    {companyLegal.businessPhoneDisplay}
                  </a>
                </li>
              </ul>
            </div>
            <BusinessContactCard />
          </div>
        </div>
      </section>

      <section className="border-t border-navy/10 bg-soft-blue py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-2xl border border-mdc-blue/15 bg-white p-8 md:p-10 shadow-sm">
            <h2 className="font-serif text-2xl text-navy md:text-3xl">SMS text messaging</h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-slate">
              You may opt in to receive SMS messages from {companyLegal.name} for inquiry follow-up,
              scheduling reminders, and business updates. Message and data rates may apply. Reply
              STOP to opt out or HELP for help. Consent is not a condition of purchase or
              investment. We do not sell or share mobile numbers for marketing.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/sms-opt-in"
                className="inline-flex rounded-full bg-mdc-blue px-6 py-3 text-sm font-semibold text-white hover:bg-navy"
              >
                SMS opt-in form
              </Link>
              <Link
                href="/privacy-policy"
                className="inline-flex rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy hover:border-mdc-blue hover:text-mdc-blue"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-and-conditions"
                className="inline-flex rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy hover:border-mdc-blue hover:text-mdc-blue"
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
