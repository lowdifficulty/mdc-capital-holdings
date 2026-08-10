import Link from "next/link";
import { companyLegal } from "@/data/site";

const pillars = [
  {
    title: "Stewardship",
    body: "Patient capital and disciplined governance for operating businesses and private investments held for the long term.",
  },
  {
    title: "Operating platform",
    body: "Hands-on support across strategy, technology, marketing, and day-to-day execution for portfolio companies.",
  },
  {
    title: "Privacy & discretion",
    body: "Direct relationships with founders, operators, and partners. Inquiries are handled personally and confidentially.",
  },
];

const focusAreas = [
  "Healthcare & life sciences",
  "Local & essential services",
  "Digital health & technology",
  "Special situations & transitions",
];

export default function FamilyOfficeHome() {
  return (
    <>
      <section className="a2p-hero relative overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute inset-0 hero-noise" />
        <div className="pointer-events-none absolute inset-0 hero-blue-glow" />
        <div className="pointer-events-none absolute inset-0 hero-blue-mesh opacity-60" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
              Private holding company
            </p>
            <h1
              className="mt-4 font-serif text-4xl tracking-tight text-white md:text-5xl lg:text-6xl"
              style={{ color: "#ffffff" }}
            >
              {companyLegal.name}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/80 md:text-xl">
              A family office–style platform focused on building, acquiring, and stewarding
              operating businesses with permanent capital, practical leadership, and a multi-decade
              horizon.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/about"
                className="inline-flex rounded-full bg-mdc-blue px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-mdc-blue/30 transition hover:-translate-y-0.5 hover:bg-[#1258d9]"
              >
                About our firm
              </Link>
              <Link
                href="/contact"
                className="inline-flex rounded-full border border-white/35 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/15"
              >
                Contact
              </Link>
              <Link
                href="/services"
                className="inline-flex rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/50"
              >
                Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-serif text-2xl text-navy md:text-3xl">Our approach</h2>
            <p className="mt-4 leading-relaxed text-slate">
              We combine the patience of a family office with the operating intensity of an active
              holding company. We are not a fund with a fixed life — we allocate capital, build
              teams, and improve businesses we intend to own and support for years.
            </p>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {pillars.map((item) => (
              <li
                key={item.title}
                className="rounded-xl border border-navy/10 bg-white p-8 shadow-sm"
              >
                <h3 className="font-serif text-xl text-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-navy/10 bg-soft-blue py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-serif text-2xl text-navy md:text-3xl">Where we focus</h2>
              <p className="mt-4 leading-relaxed text-slate">
                We look for durable demand, capable operators, and situations where our platform
                can add measurable value — not financial engineering for its own sake.
              </p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {focusAreas.map((area) => (
                  <li
                    key={area}
                    className="flex items-center gap-2 text-sm text-navy before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-mdc-blue"
                  >
                    {area}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-mdc-blue/15 bg-white p-8 md:p-10 shadow-sm">
              <h3 className="font-serif text-xl text-navy">Start a conversation</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate">
                For partnership inquiries, operating discussions, or general correspondence, reach
                our team at{" "}
                <a
                  href={`mailto:${companyLegal.contactEmail}`}
                  className="font-medium text-mdc-blue hover:text-navy"
                >
                  {companyLegal.contactEmail}
                </a>{" "}
                or use our contact form.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex rounded-full bg-mdc-blue px-6 py-3 text-sm font-semibold text-white hover:bg-navy"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
