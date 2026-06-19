import type { PortfolioCompany } from "@/data/site";

interface PortfolioCardProps {
  company: PortfolioCompany;
  variant?: "grid" | "detailed";
}

function PortfolioLogo({ company }: { company: PortfolioCompany }) {
  return (
    <div className="flex h-16 max-w-[220px] items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={company.logoSrc}
        alt={`${company.name} logo`}
        className="h-auto max-h-16 w-auto max-w-full object-contain object-left"
      />
    </div>
  );
}

export default function PortfolioCard({ company, variant = "grid" }: PortfolioCardProps) {
  if (variant === "detailed") {
    return (
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-mdc-blue/30 hover:shadow-xl">
        <div className="bg-light-gray px-8 pb-6 pt-8">
          <PortfolioLogo company={company} />
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-mdc-blue">
            {company.industry}
          </p>
          <h3 className="mt-3 font-serif text-2xl text-navy">{company.name}</h3>
        </div>
        <div className="flex flex-1 flex-col p-8 pt-6">
          <p className="text-sm leading-relaxed text-slate">
            {company.shortDescription}
          </p>
          <p className="mt-4 flex-1 text-sm leading-relaxed text-slate/90">
            {company.longDescription}
          </p>
          <ul className="mt-6 space-y-2">
            {company.keyFocusAreas.slice(0, 4).map((area) => (
              <li key={area} className="flex items-start gap-2 text-sm text-slate">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mdc-blue" />
                {area}
              </li>
            ))}
          </ul>
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-mdc-blue transition-colors group-hover:gap-3"
          >
            Visit {company.name}
            <span aria-hidden>→</span>
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-mdc-blue/30 hover:shadow-xl">
      <div className="flex min-h-40 flex-col justify-end bg-light-gray p-6">
        <PortfolioLogo company={company} />
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-mdc-blue">
          {company.category}
        </p>
        <h3 className="mt-2 font-serif text-2xl text-navy">{company.name}</h3>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="flex-1 text-sm leading-relaxed text-slate">
          {company.gridDescription}
        </p>
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-mdc-blue transition-all group-hover:gap-3"
        >
          Visit {company.name}
          <span aria-hidden>→</span>
        </a>
      </div>
    </article>
  );
}
