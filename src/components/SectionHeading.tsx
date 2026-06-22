interface SectionHeadingProps {
  eyebrow?: string;
  headline: string;
  body?: string;
  align?: "left" | "center";
  light?: boolean;
  headlineSingleLine?: boolean;
}

export default function SectionHeading({
  eyebrow,
  headline,
  body,
  align = "left",
  light = false,
  headlineSingleLine = false,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";
  const containerWidth = headlineSingleLine ? "max-w-6xl" : "max-w-3xl";

  return (
    <div className={`${containerWidth} ${alignment}`}>
      {eyebrow && (
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-mdc-blue">
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-serif leading-tight tracking-tight ${
          headlineSingleLine
            ? "whitespace-nowrap text-[clamp(1.35rem,2.5vw+0.85rem,3rem)]"
            : "text-3xl md:text-5xl"
        } ${light ? "text-white" : "text-navy"}`}
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
