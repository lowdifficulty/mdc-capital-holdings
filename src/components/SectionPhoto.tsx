import Image from "next/image";

interface SectionPhotoProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export default function SectionPhoto({
  src,
  alt,
  className = "aspect-[4/3]",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: SectionPhotoProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-navy/8 shadow-lg ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-navy/25 via-transparent to-mdc-blue/10" />
    </div>
  );
}
