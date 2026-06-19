import Image from "next/image";

interface StrategyCardProps {
  title: string;
  body: string;
  imageSrc?: string;
  imageAlt?: string;
}

export default function StrategyCard({
  title,
  body,
  imageSrc,
  imageAlt,
}: StrategyCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-mdc-blue/25 hover:shadow-lg">
      {imageSrc && imageAlt && (
        <div className="relative h-36 w-full overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
        </div>
      )}
      <div className="p-8">
        <h3 className="font-serif text-xl text-navy md:text-2xl">{title}</h3>
        <p className="mt-4 text-sm leading-relaxed text-slate">{body}</p>
      </div>
    </article>
  );
}
