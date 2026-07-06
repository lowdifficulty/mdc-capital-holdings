import Image from "next/image";
import type { PortfolioCompany } from "@/data/site";

interface PortfolioCardProps {
  company: PortfolioCompany;
  variant?: "grid" | "detailed";
  imageClassName?: string;
  luxury?: boolean;
}

function PortfolioLogo({
  company,
  luxury = false,
}: {
  company: PortfolioCompany;
  luxury?: boolean;
}) {
  return (
    <div className="flex h-16 max-w-[220px] items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={company.logoSrc}
        alt={`${company.name} logo`}
        className={`h-auto max-h-16 w-auto max-w-full object-contain object-left grayscale ${
          luxury ? "brightness-125 opacity-90" : "brightness-95 opacity-85"
        }`}
      />
    </div>
  );
}

function PortfolioImage({
  company,
  className = "h-44",
  luxury = false,
}: {
  company: PortfolioCompany;
  className?: string;
  luxury?: boolean;
}) {
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <Image
        src={company.imageSrc}
        alt={company.imageAlt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t ${
          luxury ? "from-[#050505]/50 via-transparent to-transparent" : "from-navy/55 via-navy/10"
        } to-transparent`}
      />
    </div>
  );
}

export default function PortfolioCard({
  company,
  variant = "grid",
  imageClassName,
  luxury = false,
}: PortfolioCardProps) {
  const shell = luxury
    ? "rounded-sm border border-[#c9a227]/15 bg-[#111] shadow-xl shadow-black/40 hover:border-[#c9a227]/35"
    : "rounded-2xl border border-navy/8 bg-white shadow-sm hover:border-mdc-blue/30 hover:shadow-xl";
  const meta = luxury
    ? "text-xs font-semibold uppercase tracking-widest text-[#c9a227]"
    : "text-xs font-semibold uppercase tracking-widest text-mdc-blue";
  const title = luxury ? "font-serif text-2xl text-[#f8f4ec]" : "font-serif text-2xl text-navy";
  const body = luxury
    ? "text-sm leading-relaxed text-[#eae6dc]/65"
    : "text-sm leading-relaxed text-slate";
  const bullet = luxury ? "bg-[#c9a227]" : "bg-mdc-blue";
  const link = luxury
    ? "text-sm font-semibold text-[#c9a227] transition-colors group-hover:gap-3"
    : "text-sm font-semibold text-mdc-blue transition-colors group-hover:gap-3";
  const footerBg = luxury ? "bg-[#0a0a0a]" : "bg-light-gray";

  if (variant === "detailed") {
    return (
      <article className={`group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 ${shell}`}>
        <PortfolioImage company={company} className={imageClassName} luxury={luxury} />
        <div className={`${footerBg} px-8 pb-6 pt-8`}>
          <PortfolioLogo company={company} luxury={luxury} />
          <p className={`mt-4 ${meta}`}>{company.industry}</p>
          <h3 className={`mt-3 ${title}`}>{company.name}</h3>
        </div>
        <div className="flex flex-1 flex-col p-8 pt-6">
          <p className={body}>{company.shortDescription}</p>
          <p className={`mt-4 flex-1 ${body}`}>{company.longDescription}</p>
          <ul className="mt-6 space-y-2">
            {company.keyFocusAreas.slice(0, 4).map((area) => (
              <li key={area} className={`flex items-start gap-2 ${body}`}>
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${bullet}`} />
                {area}
              </li>
            ))}
          </ul>
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-8 inline-flex items-center gap-2 ${link}`}
          >
            Visit {company.name}
            <span aria-hidden>→</span>
          </a>
        </div>
      </article>
    );
  }

  return (
    <article className={`group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 ${shell}`}>
      <PortfolioImage company={company} className={imageClassName} luxury={luxury} />
      <div className={`flex min-h-40 flex-col justify-end p-6 ${footerBg}`}>
        <PortfolioLogo company={company} luxury={luxury} />
        <p className={`mt-4 ${meta}`}>{company.category}</p>
        <h3 className={`mt-2 ${title}`}>{company.name}</h3>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className={`flex-1 ${body}`}>{company.gridDescription}</p>
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-6 inline-flex items-center gap-2 transition-all ${link}`}
        >
          Visit {company.name}
          <span aria-hidden>→</span>
        </a>
      </div>
    </article>
  );
}
