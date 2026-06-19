import Link from "next/link";
import { legalLinks, portfolioCompanies } from "@/data/site";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
              Build With MDC
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/70">
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
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-mdc-blue text-sm font-bold text-white">
                MDC
              </span>
              <span className="font-serif text-lg">MDC Capital Holdings</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              An operating holdings company building, acquiring, and growing small
              businesses and digital platforms for the long term.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Company
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/about" className="text-white/70 transition-colors hover:text-white">About</Link></li>
              <li><Link href="/strategy" className="text-white/70 transition-colors hover:text-white">Strategy</Link></li>
              <li><Link href="/portfolio" className="text-white/70 transition-colors hover:text-white">Portfolio</Link></li>
              <li><Link href="/portfolio#operating-platform" className="text-white/70 transition-colors hover:text-white">Operating Platform</Link></li>
              <li><Link href="/contact" className="text-white/70 transition-colors hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Portfolio
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {portfolioCompanies.map((company) => (
                <li key={company.id}>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {company.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Focus Areas
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li>Healthcare</li>
              <li>Local Services</li>
              <li>Digital Health</li>
              <li>Music Technology</li>
              <li>AI-Enabled Operations</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© 2026 MDC Capital Holdings. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-white"
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
