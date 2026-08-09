import Link from "next/link";
import { companyLegal, formatBusinessAddress } from "@/data/site";

const quickLinks = [
  {
    href: "/about",
    title: "About",
    description: "Who we are, legal entity, and how we operate.",
  },
  {
    href: "/services",
    title: "Services",
    description: "Holdings, operating support, and customer communication.",
  },
  {
    href: "/contact",
    title: "Contact",
    description: "Send a message — phone optional, SMS consent optional.",
  },
  {
    href: "/sms-opt-in",
    title: "SMS opt-in",
    description: "Subscribe to business text updates (unchecked consent by default).",
  },
];

export default function A2pHomeHero() {
  return (
    <section className="a2p-hero relative overflow-hidden bg-navy text-white">
      <div className="pointer-events-none absolute inset-0 hero-noise" />
      <div className="pointer-events-none absolute inset-0 hero-blue-glow" />
      <div className="pointer-events-none absolute inset-0 hero-blue-mesh opacity-60" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
            Business information
          </p>
          <h1
            className="mt-4 font-serif text-4xl tracking-tight text-white md:text-5xl lg:text-6xl"
            style={{ color: "#ffffff" }}
          >
            {companyLegal.name}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-white/80 md:text-xl">
            {companyLegal.legalEntityName} — operating holdings company. This site lists our
            registered business contact details and SMS messaging program for customers, partners,
            and carrier verification (Twilio / Grasshopper A2P).
          </p>
          <p className="mt-4 text-sm text-white/65">
            {formatBusinessAddress()} · EIN {companyLegal.ein}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="inline-flex rounded-full bg-mdc-blue px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-mdc-blue/30 transition hover:-translate-y-0.5 hover:bg-[#1258d9]"
            >
              Contact us
            </Link>
            <Link
              href="/sms-opt-in"
              className="inline-flex rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/15"
            >
              SMS opt-in form
            </Link>
            <a
              href={`tel:${companyLegal.businessPhone}`}
              className="inline-flex rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/50"
            >
              {companyLegal.businessPhoneDisplay}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function A2pQuickLinks() {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="font-serif text-2xl text-navy md:text-3xl">Explore this site</h2>
        <p className="mt-2 max-w-2xl text-slate">
          Public pages required for business and SMS program verification.
        </p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex h-full flex-col rounded-xl border border-navy/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-mdc-blue/35 hover:shadow-md"
              >
                <span className="font-semibold text-navy group-hover:text-mdc-blue">
                  {item.title}
                </span>
                <span className="mt-2 text-sm leading-relaxed text-slate">{item.description}</span>
                <span className="mt-4 text-sm font-medium text-mdc-blue">Open page →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
