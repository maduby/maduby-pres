import Image from "next/image";
import type { Slide } from "@/lib/deck/schema";
import { uiStrings } from "@/content/strings.de-ch";

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl space-y-4 text-lg leading-relaxed text-foreground/90 md:text-xl">
      {children}
    </div>
  );
}

export function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case "title":
      return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 text-center md:flex-row md:text-left">
          <div className="flex max-w-xl flex-col gap-4">
            <p className="text-sm font-medium uppercase tracking-widest text-teal-600 dark:text-teal-400">
              FHGR · Zukunft 1
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              {slide.title}
            </h1>
            {slide.subline ? (
              <p className="text-lg text-foreground/80 text-pretty md:text-2xl">
                {slide.subline}
              </p>
            ) : null}
            <a
              className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-foreground/15 px-4 py-2 text-sm font-medium text-teal-700 transition hover:bg-foreground/5 dark:text-teal-300"
              href="https://www.duby.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              {uiStrings.openWebsite}
            </a>
          </div>
          {slide.image ? (
            <div className="relative aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl border border-foreground/10 shadow-lg shadow-black/10">
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
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          {slide.kicker ? (
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400">
              {slide.kicker}
            </p>
          ) : null}
          <h2 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            {slide.title}
          </h2>
        </div>
      );

    case "text":
      return (
        <div className="flex min-h-[60vh] flex-col justify-center gap-6">
          {slide.heading ? (
            <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
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
            className={`relative w-full overflow-hidden rounded-2xl border border-foreground/10 ${aspect}`}
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
            <p className="text-base text-foreground/80">{slide.caption}</p>
          ) : null}
          {slide.credit ? (
            <p className="text-sm text-foreground/55">{slide.credit}</p>
          ) : null}
        </div>
      );
    }

    case "iframe": {
      const aspect = slide.aspectClass ?? "aspect-video";
      return (
        <div className="flex min-h-[60vh] flex-col justify-center gap-4">
          <div
            className={`relative w-full overflow-hidden rounded-2xl border border-foreground/10 bg-black/5 ${aspect}`}
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
            <p className="text-sm text-foreground/70">{slide.caption}</p>
          ) : null}
        </div>
      );
    }

    case "timeline":
      return (
        <div className="flex min-h-[60vh] flex-col justify-center gap-8">
          {slide.heading ? (
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {slide.heading}
            </h2>
          ) : null}
          <ol className="relative grid gap-6 border-l border-foreground/15 pl-6 md:gap-8">
            {slide.items.map((item) => (
              <li key={`${item.period}-${item.title}`} className="relative">
                <span className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full bg-teal-500 ring-4 ring-background" />
                <p className="text-sm font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">
                  {item.period}
                </p>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 max-w-3xl text-foreground/85">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      );

    case "twoColumn":
      return (
        <div className="grid min-h-[60vh] items-center gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            {slide.left.heading ? (
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {slide.left.heading}
              </h2>
            ) : null}
            <Prose>
              {slide.left.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </Prose>
          </div>
          <div className="flex flex-col gap-3">
            {slide.right.kind === "image" ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-foreground/10">
                <Image
                  src={slide.right.src}
                  alt={slide.right.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-foreground/10 bg-black/5">
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
              <p className="text-sm text-foreground/70">{slide.right.caption}</p>
            ) : null}
          </div>
        </div>
      );

    case "quote":
      return (
        <figure className="flex min-h-[50vh] flex-col justify-center gap-6">
          <blockquote className="text-3xl font-medium leading-snug text-balance md:text-4xl">
            «{slide.text}»
          </blockquote>
          {slide.attribution ? (
            <figcaption className="text-lg text-foreground/70">
              — {slide.attribution}
            </figcaption>
          ) : null}
        </figure>
      );

  }
}
