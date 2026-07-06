import Image from "next/image";

interface SectionPhotoProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  luxury?: boolean;
  fit?: "cover" | "contain";
  width?: number;
  height?: number;
}

export default function SectionPhoto({
  src,
  alt,
  className = "aspect-[4/3]",
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  luxury = false,
  fit = "cover",
  width,
  height,
}: SectionPhotoProps) {
  const shellClass = `relative overflow-hidden rounded-2xl border shadow-lg ${
    luxury ? "border-[#c9a227]/15" : "border-navy/8"
  }`;

  const overlayClass = `pointer-events-none absolute inset-0 ${
    luxury
      ? "bg-gradient-to-tr from-black/20 via-transparent to-[#c9a227]/5"
      : "bg-gradient-to-tr from-navy/25 via-transparent to-mdc-blue/10"
  }`;

  const useContain = fit === "contain";

  if (useContain && width && height) {
    return (
      <div className={`${shellClass} ${className}`}>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes={sizes}
          className="block h-auto w-full"
        />
        <div className={overlayClass} />
      </div>
    );
  }

  return (
    <div className={`group ${shellClass} ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={`${
          useContain ? "object-contain" : "object-cover"
        } transition-transform duration-500 group-hover:scale-105`}
      />
      <div className={overlayClass} />
    </div>
  );
}
