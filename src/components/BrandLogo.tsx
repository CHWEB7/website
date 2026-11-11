import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  priority?: boolean;
};

export default function BrandLogo({ priority = false }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5"
      aria-label="Kettu home"
    >
      <Image
        src="/logo.png"
        alt=""
        width={44}
        height={44}
        priority={priority}
        className="h-10 w-10 object-contain sm:h-11 sm:w-11"
      />
      <span className="font-display text-[1.35rem] font-semibold tracking-[-0.04em] text-ink sm:text-[1.5rem]">
        Kettu
      </span>
    </Link>
  );
}
