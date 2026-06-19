import Hero from "@/components/Hero";

interface LegalDocumentProps {
  title: string;
  description: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalDocument({
  title,
  description,
  lastUpdated,
  children,
}: LegalDocumentProps) {
  return (
    <>
      <Hero compact headline={title} body={description} />

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <p className="text-sm text-slate">Last updated: {lastUpdated}</p>
          <div className="prose-legal mt-10 space-y-10 text-base leading-relaxed text-slate">
            {children}
          </div>
        </div>
      </section>
    </>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-serif text-xl text-navy md:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function LegalLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-mdc-blue underline decoration-mdc-blue/30 underline-offset-2 transition-colors hover:text-navy"
      >
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      className="font-medium text-mdc-blue underline decoration-mdc-blue/30 underline-offset-2 transition-colors hover:text-navy"
    >
      {children}
    </a>
  );
}
