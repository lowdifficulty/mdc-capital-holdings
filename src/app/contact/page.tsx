import type { Metadata } from "next";
import A2pPageHero from "@/components/a2p/A2pPageHero";
import A2pContactForm from "@/components/a2p/A2pContactForm";
import BusinessContactCard from "@/components/a2p/BusinessContactCard";

export const metadata: Metadata = {
  title: "Contact | MDC Capital Holdings",
  description: "Contact MDC Capital Holdings — address, phone, email, and inquiry form.",
};

export default function ContactPage() {
  return (
    <>
      <A2pPageHero
        title="Contact us"
        description="Send a message about partnerships, customer support, or scheduling. Phone is optional on this form; SMS consent is optional and unchecked by default."
      />

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl text-slate-900">Business contact</h2>
              <div className="mt-6">
                <BusinessContactCard />
              </div>
            </div>
            <div className="lg:col-span-3">
              <A2pContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
