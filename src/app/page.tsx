import type { Metadata } from "next";
import Link from "next/link";
import BusinessContactCard from "@/components/a2p/BusinessContactCard";
import { companyLegal } from "@/data/site";

export const metadata: Metadata = {
  title: "MDC Capital Holdings | Business Information",
  description:
    "MDC Capital Holdings — operating holdings company. Contact, SMS program information, and business details for partners and customers.",
};

export default function HomePage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
          <h1 className="font-serif text-3xl tracking-tight text-slate-900 md:text-4xl">
            {companyLegal.name}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {companyLegal.legalEntityName} is an operating holdings company that builds, acquires,
            and supports small businesses and digital platforms. This site provides our business
            contact information and SMS messaging program details for customers and partners.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex rounded-full bg-mdc-blue px-6 py-3 text-sm font-semibold text-white hover:bg-navy"
            >
              Contact us
            </Link>
            <Link
              href="/sms-opt-in"
              className="inline-flex rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 hover:border-mdc-blue hover:text-mdc-blue"
            >
              SMS opt-in
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="font-serif text-2xl text-slate-900">Business contact</h2>
          <p className="mt-3 text-slate-600">
            Reach our team for partnerships, operating support, customer inquiries, and scheduling.
          </p>
          <div className="mt-8">
            <BusinessContactCard />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="font-serif text-2xl text-slate-900">SMS text messaging</h2>
          <p className="mt-3 leading-relaxed text-slate-600">
            You may opt in to receive SMS messages from {companyLegal.name} for inquiry follow-up,
            scheduling reminders, and business updates. Message and data rates may apply. Reply STOP
            to opt out or HELP for help. Consent is not a condition of purchase or investment.
          </p>
          <p className="mt-4">
            <Link href="/sms-opt-in" className="font-medium text-mdc-blue hover:text-navy">
              View the SMS opt-in form →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
