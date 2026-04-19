import Image from "next/image";
import type { Slide } from "@/lib/deck/schema";
import { uiStrings } from "@/content/strings.de-ch";

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl space-y-5 text-lg font-semibold leading-relaxed text-foreground/90 md:text-xl md:leading-relaxed">
      {children}
    </div>
  );
}

export function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case "title":
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-10 text-center md:flex-row md:text-left">
          <div className="flex max-w-xl flex-col gap-5">
            <p className="inline-flex w-fit items-center border-2 border-foreground bg-brutal-accent px-3 py-1 font-sans text-xs font-extrabold uppercase tracking-[0.2em] text-brutal-accent-fg brutal-shadow-sm">
              FHGR · Zukunft 1
            </p>
            <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-balance md:text-6xl">
              {slide.title}
            </h1>
            {slide.subline ? (
              <p className="font-sans text-lg font-semibold leading-snug text-pretty text-foreground/85 md:text-2xl md:leading-snug">
                {slide.subline}
              </p>
            ) : null}
            <a
              className="brutal-pressable mt-2 inline-flex w-fit items-center gap-2 border-[3px] border-foreground bg-brutal-accent px-5 py-2.5 font-sans text-sm font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow"
              href="https://www.duby.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              {uiStrings.openWebsite}
            </a>
          </div>
          {slide.image ? (
            <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden border-[3px] border-foreground bg-foreground brutal-shadow">
              <Image
                src={slide.image.src}
                alt={slide.image.alt}
                width={slide.image.width ?? 900}
                height={slide.image.height ?? 675}
                className="h-full w-full object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 512px"
              />
            </div>
          ) : null}
        </div>
      );

    case "section":
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          {slide.kicker ? (
            <p className="font-sans text-xs font-extrabold uppercase tracking-[0.28em] text-brutal-hot">
              {slide.kicker}
            </p>
          ) : null}
          <h2 className="font-heading max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-balance md:text-6xl">
            {slide.title}
          </h2>
        </div>
      );

    case "text":
      return (
        <div className="flex min-h-[60vh] flex-col justify-center gap-8">
          {slide.heading ? (
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-balance md:text-5xl">
              {slide.heading}
            </h2>
          ) : null}
          <Prose>
            {slide.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </Prose>
        </div>
      );

    case "media": {
      const aspect =
        slide.variant === "square"
          ? "aspect-square max-w-2xl"
          : slide.variant === "tall"
            ? "aspect-[3/4] max-w-md"
            : "aspect-video max-w-5xl";
      return (
        <div className="flex min-h-[60vh] flex-col justify-center gap-6">
          <div
            className={`relative w-full overflow-hidden border-[3px] border-foreground bg-foreground brutal-shadow ${aspect}`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
          {slide.caption ? (
            <p className="font-sans text-base font-semibold text-foreground/85">{slide.caption}</p>
          ) : null}
          {slide.credit ? (
            <p className="font-sans text-sm font-bold uppercase tracking-wide text-foreground/55">
              {slide.credit}
            </p>
          ) : null}
        </div>
      );
    }

    case "iframe": {
      const aspect = slide.aspectClass ?? "aspect-video";
      return (
        <div className="flex min-h-[60vh] flex-col justify-center gap-4">
          <div
            className={`relative w-full overflow-hidden border-[3px] border-foreground bg-foreground brutal-shadow ${aspect}`}
          >
            <iframe
              title={slide.title}
              src={slide.src}
              className="h-full w-full"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="fullscreen"
            />
          </div>
          {slide.caption ? (
            <p className="font-sans text-sm font-semibold text-foreground/80">{slide.caption}</p>
          ) : null}
        </div>
      );
    }

    case "timeline":
      return (
        <div className="flex min-h-[60vh] flex-col justify-center gap-10">
          {slide.heading ? (
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-5xl">
              {slide.heading}
            </h2>
          ) : null}
          <ol className="relative grid gap-6 border-l-[3px] border-foreground pl-8 md:gap-8">
            {slide.items.map((item) => (
              <li key={`${item.period}-${item.title}`} className="relative">
                <span className="absolute -left-[37px] top-2 h-4 w-4 border-2 border-foreground bg-brutal-accent brutal-shadow-sm" />
                <p className="font-sans text-xs font-extrabold uppercase tracking-widest text-brutal-hot">
                  {item.period}
                </p>
                <h3 className="font-heading mt-1 text-2xl font-bold">{item.title}</h3>
                <p className="mt-3 max-w-3xl font-sans text-base font-semibold leading-relaxed text-foreground/88">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      );

    case "twoColumn":
      return (
        <div className="grid min-h-[60vh] items-center gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-5">
            {slide.left.heading ? (
              <h2 className="font-heading text-2xl font-bold tracking-tight md:text-4xl">
                {slide.left.heading}
              </h2>
            ) : null}
            <Prose>
              {slide.left.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Prose>
          </div>
          <div className="flex flex-col gap-4">
            {slide.right.kind === "image" ? (
              <div className="relative aspect-video w-full overflow-hidden border-[3px] border-foreground brutal-shadow">
                <Image
                  src={slide.right.src}
                  alt={slide.right.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden border-[3px] border-foreground bg-foreground brutal-shadow">
                <iframe
                  title={slide.right.title}
                  src={slide.right.src}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="fullscreen"
                />
              </div>
            )}
            {slide.right.kind === "image" && slide.right.caption ? (
              <p className="font-sans text-sm font-semibold text-foreground/75">{slide.right.caption}</p>
            ) : null}
          </div>
        </div>
      );

    case "quote":
      return (
        <figure className="flex min-h-[50vh] flex-col justify-center gap-8 border-[3px] border-foreground bg-foreground/[0.03] p-8 brutal-shadow md:p-12">
          <blockquote className="font-heading text-3xl font-bold leading-snug text-balance md:text-5xl md:leading-snug">
            «{slide.text}»
          </blockquote>
          {slide.attribution ? (
            <figcaption className="font-sans text-lg font-extrabold uppercase tracking-wide text-foreground/75">
              — {slide.attribution}
            </figcaption>
          ) : null}
        </figure>
      );

  }
}
