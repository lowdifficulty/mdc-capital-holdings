import type { Metadata } from "next";
import A2pPageHero from "@/components/a2p/A2pPageHero";
import A2pSmsOptInForm from "@/components/a2p/A2pSmsOptInForm";
import BusinessContactCard from "@/components/a2p/BusinessContactCard";
import { smsKeywordOptInNote } from "@/data/a2p";
import { companyLegal } from "@/data/site";

export const metadata: Metadata = {
  title: "SMS Opt-In | MDC Capital Holdings",
  description:
    "Opt in to receive SMS messages from MDC Capital Holdings. Message and data rates may apply. Reply STOP to opt out.",
};

export default function SmsOptInPage() {
  return (
    <>
      <A2pPageHero
        title="SMS text message opt-in"
        description={`Subscribe to ${companyLegal.smsProgramName} for inquiry follow-up, scheduling, and business updates. The consent checkbox below is unchecked by default.`}
      />

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-2 space-y-6 text-sm leading-relaxed text-slate-600">
              <p>{smsKeywordOptInNote}</p>
              <p>
                Message and data rates may apply. Message frequency may vary. Reply STOP to opt out
                or HELP for help. SMS consent is not a condition of purchase or investment.
              </p>
              <BusinessContactCard />
            </div>
            <div className="lg:col-span-3">
              <A2pSmsOptInForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
