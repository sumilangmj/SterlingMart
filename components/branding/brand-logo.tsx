import Image from "next/image";

type BrandLogoProps = {
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ variant = "full", className, priority = false }: BrandLogoProps) {
  const isMark = variant === "mark";

  return (
    <Image
      className={className}
      src={isMark ? "/sterling-mart-mark.png" : "/sterling-mart-logo.png"}
      alt="SM Sterling Mart"
      width={isMark ? 512 : 1308}
      height={isMark ? 512 : 864}
      priority={priority}
      sizes={isMark ? "64px" : "(max-width: 700px) 140px, 180px"}
    />
  );
}
