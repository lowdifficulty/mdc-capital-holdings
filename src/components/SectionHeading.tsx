interface SectionHeadingProps {
  eyebrow?: string;
  headline: string;
  body?: string;
  align?: "left" | "center";
  light?: boolean;
}

export default function SectionHeading({
  eyebrow,
  headline,
  body,
  align = "left",
  light = false,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";

  return (
    <div className={`max-w-3xl ${alignment}`}>
      {eyebrow && (
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-mdc-blue">
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-serif text-3xl leading-tight tracking-tight md:text-5xl ${
          light ? "text-white" : "text-navy"
        }`}
      >
        {headline}
      </h2>
      {body && (
        <p
          className={`mt-6 text-base leading-relaxed md:text-lg ${
            light ? "text-white/70" : "text-slate"
          }`}
        >
          {body}
        </p>
      )}
    </div>
  );
}
