import Link from "next/link";
import { legalLinks, portfolioCompanies } from "@/data/site";

export default function Footer({ luxury = false }: { luxury?: boolean }) {
  return (
    <footer className={luxury ? "bg-[#050505] text-[#eae6dc]" : "bg-navy text-white"}>
      <div className={luxury ? "border-b border-[#c9a227]/15" : "border-b border-white/10"}>
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-xl">
            <h2
              className={`font-serif text-3xl tracking-tight md:text-4xl ${
                luxury ? "text-[#f8f4ec]" : ""
              }`}
            >
              Build With MDC
            </h2>
            <p
              className={`mt-4 text-base leading-relaxed ${
                luxury ? "text-[#eae6dc]/60" : "text-white/70"
              }`}
            >
              Whether you are growing, transitioning, or building from scratch, we
              bring long-term operating support to businesses with real demand.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 items-center justify-center text-sm font-bold ${
                  luxury
                    ? "rounded-sm bg-[#c9a227] text-[#050505]"
                    : "rounded-md bg-mdc-blue text-white"
                }`}
              >
                MDC
              </span>
              <span className={`font-serif text-lg ${luxury ? "text-[#f8f4ec]" : ""}`}>
                MDC Capital Holdings
              </span>
            </div>
            <p
              className={`mt-4 text-sm leading-relaxed ${
                luxury ? "text-[#eae6dc]/55" : "text-white/60"
              }`}
            >
              An operating holdings company building, acquiring, and growing small
              businesses and digital platforms for the long term.
            </p>
          </div>

          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-widest ${
                luxury ? "text-[#c9a227]/70" : "text-white/50"
              }`}
            >
              Company
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                { href: "/about", label: "About" },
                { href: "/strategy", label: "Strategy" },
                { href: "/portfolio", label: "Portfolio" },
                { href: "/portfolio#operating-platform", label: "Operating Platform" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={
                      luxury
                        ? "text-[#eae6dc]/65 transition-colors hover:text-[#c9a227]"
                        : "text-white/70 transition-colors hover:text-white"
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-widest ${
                luxury ? "text-[#c9a227]/70" : "text-white/50"
              }`}
            >
              Portfolio
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {portfolioCompanies.map((company) => (
                <li key={company.id}>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      luxury
                        ? "text-[#eae6dc]/65 transition-colors hover:text-[#c9a227]"
                        : "text-white/70 transition-colors hover:text-white"
                    }
                  >
                    {company.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-widest ${
                luxury ? "text-[#c9a227]/70" : "text-white/50"
              }`}
            >
              Focus Areas
            </h3>
            <ul
              className={`mt-4 space-y-3 text-sm ${
                luxury ? "text-[#eae6dc]/65" : "text-white/70"
              }`}
            >
              <li>Healthcare</li>
              <li>Local Services</li>
              <li>Digital Health</li>
              <li>Music Technology</li>
              <li>AI-Enabled Operations</li>
            </ul>
          </div>
        </div>

        <div
          className={`mt-16 flex flex-col gap-4 border-t pt-8 text-sm md:flex-row md:items-center md:justify-between ${
            luxury
              ? "border-[#c9a227]/15 text-[#eae6dc]/45"
              : "border-white/10 text-white/50"
          }`}
        >
          <p>© 2026 MDC Capital Holdings. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={
                    luxury
                      ? "transition-colors hover:text-[#c9a227]"
                      : "transition-colors hover:text-white"
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
