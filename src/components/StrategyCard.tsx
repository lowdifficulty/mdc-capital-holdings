import Image from "next/image";

interface StrategyCardProps {
  title: string;
  body: string;
  imageSrc?: string;
  imageAlt?: string;
  luxury?: boolean;
}

export default function StrategyCard({
  title,
  body,
  imageSrc,
  imageAlt,
  luxury = false,
}: StrategyCardProps) {
  const shell = luxury
    ? "rounded-sm border border-[#c9a227]/15 bg-[#111] shadow-xl shadow-black/30 hover:border-[#c9a227]/35"
    : "rounded-2xl border border-navy/8 bg-white shadow-sm hover:border-mdc-blue/25 hover:shadow-lg";

  return (
    <article className={`group overflow-hidden transition-all duration-300 hover:-translate-y-1 ${shell}`}>
      {imageSrc && imageAlt && (
        <div className="relative h-36 w-full overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            className={`absolute inset-0 bg-gradient-to-t ${
              luxury ? "from-[#050505]/60" : "from-navy/40"
            } to-transparent`}
          />
        </div>
      )}
      <div className="p-8">
        <h3
          className={`font-serif text-xl md:text-2xl ${
            luxury ? "text-[#f8f4ec]" : "text-navy"
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-4 text-sm leading-relaxed ${
            luxury ? "text-[#eae6dc]/65" : "text-slate"
          }`}
        >
          {body}
        </p>
      </div>
    </article>
  );
}
