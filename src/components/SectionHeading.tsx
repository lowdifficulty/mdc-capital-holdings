interface SectionHeadingProps {
  eyebrow?: string;
  headline: string;
  body?: string;
  align?: "left" | "center";
  light?: boolean;
  luxury?: boolean;
  headlineSingleLine?: boolean;
}

export default function SectionHeading({
  eyebrow,
  headline,
  body,
  align = "left",
  light = false,
  luxury = false,
  headlineSingleLine = false,
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "text-left";
  const containerWidth = headlineSingleLine ? "w-full max-w-6xl" : "max-w-3xl";
  const eyebrowClass = luxury ? "text-[#c9a227]" : "text-mdc-blue";
  const headlineClass = luxury
    ? "text-[#f8f4ec]"
    : light
      ? "text-white"
      : "text-navy";
  const bodyClass = luxury
    ? "text-[#eae6dc]/65"
    : light
      ? "text-white/70"
      : "text-slate";

  return (
    <div className={`${containerWidth} ${alignment}`}>
      {eyebrow && (
        <p className={`mb-4 text-xs font-semibold uppercase tracking-[0.2em] ${eyebrowClass}`}>
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-serif leading-tight tracking-tight ${
          headlineSingleLine
            ? "text-3xl md:text-4xl lg:text-5xl lg:whitespace-nowrap"
            : "text-3xl md:text-5xl"
        } ${headlineClass}`}
      >
        {headline}
      </h2>
      {body && (
        <p className={`mt-6 whitespace-pre-line text-base leading-relaxed md:text-lg ${bodyClass}`}>
          {body}
        </p>
      )}
    </div>
  );
}
