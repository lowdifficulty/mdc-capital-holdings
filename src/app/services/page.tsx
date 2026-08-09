import type { Metadata } from "next";
import A2pPageHero from "@/components/a2p/A2pPageHero";
import { companyLegal } from "@/data/site";

export const metadata: Metadata = {
  title: "Services | MDC Capital Holdings",
  description: "Services offered by MDC Capital Holdings and our operating platform.",
};

const services = [
  {
    title: "Holdings & acquisitions",
    body: "Identifying, acquiring, and integrating small businesses and digital platforms with durable demand.",
  },
  {
    title: "Operating support",
    body: "Hands-on leadership in marketing, customer acquisition, fulfillment, systems, and day-to-day operations.",
  },
  {
    title: "Technology & AI systems",
    body: "Websites, portals, workflow automation, and command-center tooling for portfolio operators.",
  },
  {
    title: "Customer communication",
    body: "Business inquiries, scheduling, reminders, and follow-up—including SMS when customers opt in through our published forms.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <A2pPageHero
        title="Services"
        description={`${companyLegal.name} provides operating and growth services to portfolio companies and partners. Contact us to discuss partnerships or customer support.`}
      />

      <section className="py-14">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <ul className="space-y-8">
            {services.map((item) => (
              <li key={item.title} className="border-b border-slate-100 pb-8 last:border-0">
                <h2 className="font-serif text-xl text-slate-900">{item.title}</h2>
                <p className="mt-2 leading-relaxed text-slate-600">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
