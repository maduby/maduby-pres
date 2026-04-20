import Image, { type ImageProps, type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

function hasAutoBlurData(
  src: string | StaticImageData,
): src is StaticImageData & { blurDataURL: string } {
  return (
    typeof src !== "string" &&
    typeof src.blurDataURL === "string" &&
    src.blurDataURL.length > 0
  );
}

type BlurUpImageProps = Omit<
  ImageProps,
  "alt" | "blurDataURL" | "className" | "fill" | "height" | "placeholder" | "sizes" | "src" | "width"
> & {
  alt: string;
  imageClassName?: string;
  objectFit?: "contain" | "cover";
  ratioClass: string;
  sizes: string;
  src: string | StaticImageData;
  wrapperClassName?: string;
};

export function BlurUpImage({
  alt,
  imageClassName,
  objectFit = "cover",
  priority,
  ratioClass,
  sizes,
  src,
  wrapperClassName,
  ...rest
}: BlurUpImageProps) {
  const blurDataURL = hasAutoBlurData(src) ? src.blurDataURL : undefined;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        ratioClass,
        wrapperClassName,
      )}
    >
      <Image
        fill
        alt={alt}
        blurDataURL={blurDataURL}
        className={cn(
          objectFit === "contain" ? "object-contain" : "object-cover",
          imageClassName,
        )}
        placeholder={blurDataURL ? "blur" : "empty"}
        priority={priority}
        sizes={sizes}
        src={src}
        {...rest}
      />
    </div>
  );
}
