import type { Metadata } from "next";
import Hero from "@/components/Hero";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Partner With MDC | MDC Capital Holdings",
  description:
    "Start a conversation with MDC Capital Holdings about partnerships, acquisitions, operating support, or strategic growth.",
};

export default function ContactPage() {
  return (
    <>
      <Hero
        compact
        luxury
        headline="Let's build something durable."
        body="Whether you are a founder, small business owner, operator, investor, or strategic partner, MDC Capital Holdings is interested in conversations with people building real businesses."
      />

      <section className="border-t border-[#c9a227]/10 pt-8 pb-24 md:pt-11 md:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl text-[#f8f4ec] md:text-3xl">
                Start the conversation
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#eae6dc]/65">
                We are especially interested in businesses where our operating platform
                can create value through better marketing, technology, systems, customer
                acquisition, fulfillment, or strategic growth.
              </p>
              <div className="mt-8 space-y-4 text-sm text-[#eae6dc]/60">
                <p>
                  <span className="font-semibold text-[#c9a227]">Focus areas:</span> Healthcare,
                  local services, digital health, music technology, and AI-enabled operations.
                </p>
                <p>
                  <span className="font-semibold text-[#c9a227]">Partnership types:</span>{" "}
                  Acquisitions, operating partnerships, platform builds, and growth support.
                </p>
              </div>
            </div>
            <div className="lg:col-span-3">
              <ContactForm luxury />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
