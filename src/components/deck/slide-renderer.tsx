import { Fragment } from "react";
import type { RichTextLine, Slide, TextParagraph } from "@/lib/deck/schema";
import { BrutalGradientChip } from "@/components/deck/brutal-gradient-chip";
import { LivePollSlideContent } from "@/components/deck/live-poll-slide";
import { BlurUpImage } from "@/components/ui/blur-up-image";
import { uiStrings } from "@/content/strings.de-ch";
import { linkifyHttpUrls, prepareTrustedHtmlLinks } from "@/lib/deck/link-content";

function RichLine({ value }: { value: RichTextLine }) {
  if (typeof value === "string") {
    return <span className="inline text-inherit">{linkifyHttpUrls(value)}</span>;
  }
  if ("brutalChip" in value) {
    return (
      <BrutalGradientChip
        label={value.brutalChip.label}
        preserveCase={value.brutalChip.preserveCase === true}
      />
    );
  }
  return <span dangerouslySetInnerHTML={{ __html: prepareTrustedHtmlLinks(value.html) }} />;
}

function ProseParagraph({ value }: { value: TextParagraph }) {
  if (Array.isArray(value)) {
    return (
      <p>
        {value.map((part, i) => (
          <Fragment key={i}>
            <RichLine value={part} />
          </Fragment>
        ))}
      </p>
    );
  }
  if (typeof value === "string") {
    return <p>{linkifyHttpUrls(value)}</p>;
  }
  if ("brutalChip" in value) {
    return (
      <p>
        <BrutalGradientChip
          label={value.brutalChip.label}
          preserveCase={value.brutalChip.preserveCase === true}
        />
      </p>
    );
  }
  return <p dangerouslySetInnerHTML={{ __html: prepareTrustedHtmlLinks(value.html) }} />;
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl space-y-3 text-sm font-semibold leading-relaxed text-foreground/90 sm:space-y-4 sm:text-base md:space-y-5 md:text-lg md:leading-relaxed xl:text-xl">
      {children}
    </div>
  );
}

export function SlideRenderer({
  slide,
  slideIndex,
  activeSlideIndex,
}: {
  slide: Slide;
  slideIndex: number;
  activeSlideIndex: number;
}) {
  switch (slide.kind) {
    case "title":
      return (
        <div className="flex min-h-0 flex-col items-center justify-start gap-4 py-2 text-center sm:gap-5 sm:py-2 md:flex-row md:gap-8 md:py-3 md:text-left">
          <div className="flex max-w-xl flex-col gap-3 sm:gap-4 md:gap-5">
            <p className="inline-flex w-fit items-center border-2 border-foreground bg-brutal-accent px-2 py-0.5 font-sans text-[10px] font-extrabold uppercase tracking-[0.18em] text-brutal-accent-fg brutal-shadow-sm sm:px-3 sm:py-1 sm:text-xs sm:tracking-[0.2em]">
              FHGR · Zukunft 1
            </p>
            <h1 className="font-heading text-2xl font-bold leading-[1.1] tracking-tight text-balance sm:text-3xl md:text-5xl md:leading-[1.08] xl:text-6xl">
              {slide.title}
            </h1>
            {slide.subline ? (
              <p className="flex flex-wrap items-center justify-center gap-x-0 font-sans text-sm font-semibold leading-snug text-pretty text-foreground/85 sm:text-base md:justify-start md:text-xl md:leading-snug lg:text-2xl">
                {Array.isArray(slide.subline) ? (
                  slide.subline.map((part, i) => (
                    <Fragment key={i}>
                      <RichLine value={part} />
                    </Fragment>
                  ))
                ) : (
                  <RichLine value={slide.subline} />
                )}
              </p>
            ) : null}
            <a
              className="brutal-pressable mt-1 inline-flex w-fit items-center gap-2 border-[3px] border-foreground bg-brutal-accent px-3 py-2 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow sm:mt-2 sm:px-5 sm:py-2.5 sm:text-sm"
              href="https://www.duby.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              {uiStrings.openWebsite}
            </a>
          </div>
          {slide.image ? (
            <div className="mb-8 w-full max-w-[min(100%,340px)] shrink-0 self-center sm:mb-10 sm:max-w-[380px] md:mb-12 md:max-w-[420px] md:self-start">
              <BlurUpImage
                src={slide.image.src}
                alt={slide.image.alt}
                priority
                ratioClass={slide.image.ratioClass ?? "aspect-[3/4] w-full"}
                sizes={slide.image.sizes ?? "(max-width: 768px) 90vw, 420px"}
                wrapperClassName="shrink-0 border-[3px] border-foreground bg-foreground brutal-shadow"
              />
            </div>
          ) : null}
        </div>
      );

    case "section":
      return (
        <div className="flex min-h-0 flex-col items-center justify-center gap-3 py-2 text-center sm:gap-4 md:py-3">
          {slide.kicker ? (
            <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.22em] text-brutal-hot sm:text-xs sm:tracking-[0.28em]">
              {slide.kicker}
            </p>
          ) : null}
          <h2 className="font-heading max-w-4xl text-2xl font-bold leading-[1.12] tracking-tight text-balance sm:text-3xl md:text-5xl md:leading-[1.1] xl:text-6xl">
            {slide.title}
          </h2>
          {slide.subtitle ? (
            <p className="max-w-2xl font-sans text-sm font-semibold leading-snug text-foreground/85 sm:text-base md:text-lg">
              {slide.subtitle}
            </p>
          ) : null}
          {slide.bullets && slide.bullets.length > 0 ? (
            <ul className="max-w-2xl list-disc space-y-2 pl-5 text-left font-sans text-sm font-semibold leading-snug text-foreground/90 sm:space-y-2.5 sm:pl-6 sm:text-base md:text-lg">
              {slide.bullets.map((item, i) => (
                <li key={`${i}-${item.slice(0, 24)}`} className="pl-1 marker:text-brutal-hot">
                  {linkifyHttpUrls(item)}
                </li>
              ))}
            </ul>
          ) : null}
          {slide.ctas && slide.ctas.length > 0 ? (
            <div className="mt-1 flex flex-wrap justify-center gap-3 sm:mt-2">
              {slide.ctas.map((cta, i) => {
                const openInNewTab = /^https?:\/\//i.test(cta.href);
                return (
                  <a
                    key={`${cta.href}-${i}`}
                    className="brutal-pressable inline-flex w-fit items-center gap-2 border-[3px] border-foreground bg-brutal-accent px-3 py-2 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow sm:px-5 sm:py-2.5 sm:text-sm"
                    href={cta.href}
                    {...(openInNewTab
                      ? { target: "_blank" as const, rel: "noopener noreferrer" }
                      : {})}
                  >
                    {cta.label}
                  </a>
                );
              })}
            </div>
          ) : null}
          {slide.image ? (
            <div
              className={
                slide.image.frameClass
                  ? `mt-2 mb-8 w-full shrink-0 sm:mt-3 sm:mb-10 md:mb-12 ${slide.image.frameClass}`
                  : "mt-2 mb-8 w-full max-w-[min(100%,320px)] shrink-0 sm:mt-3 sm:mb-10 sm:max-w-[360px] md:mb-12 md:max-w-[400px]"
              }
            >
              <BlurUpImage
                src={slide.image.src}
                alt={slide.image.alt}
                ratioClass={slide.image.ratioClass ?? "aspect-[3/4] w-full"}
                sizes={slide.image.sizes ?? "(max-width: 768px) 85vw, 400px"}
                wrapperClassName="border-[3px] border-foreground bg-foreground brutal-shadow mx-auto"
              />
              {slide.image.caption ? (
                <p className="mx-auto mt-2 max-w-2xl px-1 pb-3 font-sans text-sm font-semibold leading-snug text-foreground/85 sm:mt-3 sm:pb-4 sm:text-base md:pb-5">
                  {slide.image.caption}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      );

    case "text": {
      const n = slide.paragraphs.length;
      const hasCtas = Boolean(slide.ctas && slide.ctas.length > 0);
      const mid =
        hasCtas && slide.ctasAfterParagraphIndex !== undefined
          ? Math.min(Math.max(0, slide.ctasAfterParagraphIndex), n - 1)
          : null;

      const ctasEl = hasCtas ? (
        <div className="mt-1 flex flex-wrap gap-3 sm:mt-2">
          {slide.ctas!.map((cta, i) => {
            const openInNewTab = /^https?:\/\//i.test(cta.href);
            return (
              <a
                key={`${cta.href}-${i}`}
                className="brutal-pressable inline-flex w-fit items-center gap-2 border-[3px] border-foreground bg-brutal-accent px-3 py-2 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow sm:px-5 sm:py-2.5 sm:text-sm"
                href={cta.href}
                {...(openInNewTab
                  ? { target: "_blank" as const, rel: "noopener noreferrer" }
                  : {})}
              >
                {cta.label}
              </a>
            );
          })}
        </div>
      ) : null;

      const firstEnd = mid !== null ? mid + 1 : undefined;

      return (
        <div className="flex min-h-0 flex-col justify-start gap-4 py-2 sm:gap-6 sm:py-2 md:gap-8 md:py-3">
          {slide.heading ? (
            <h2 className="font-heading text-xl font-bold leading-tight tracking-tight text-balance sm:text-2xl md:text-4xl lg:text-5xl">
              {slide.heading}
            </h2>
          ) : null}
          <Prose>
            {slide.paragraphs.slice(0, firstEnd).map((p, i) => (
              <ProseParagraph key={i} value={p} />
            ))}
          </Prose>
          {mid !== null ? ctasEl : null}
          {mid !== null && mid < n - 1 ? (
            <Prose>
              {slide.paragraphs.slice(mid + 1).map((p, i) => (
                <ProseParagraph key={mid + 1 + i} value={p} />
              ))}
            </Prose>
          ) : null}
          {slide.bullets && slide.bullets.length > 0 ? (
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-left font-sans text-sm font-semibold leading-relaxed text-foreground/90 sm:space-y-2.5 sm:pl-6 sm:text-base md:text-lg md:leading-relaxed xl:text-xl">
              {slide.bullets.map((item, i) => (
                <li key={`${i}-${item.slice(0, 24)}`} className="pl-1 marker:text-brutal-hot">
                  {linkifyHttpUrls(item)}
                </li>
              ))}
            </ul>
          ) : null}
          {slide.trailParagraphs && slide.trailParagraphs.length > 0 ? (
            <Prose>
              {slide.trailParagraphs.map((p, i) => (
                <ProseParagraph key={`trail-${i}`} value={p} />
              ))}
            </Prose>
          ) : null}
          {slide.trailBullets && slide.trailBullets.length > 0 ? (
            <ul className="max-w-3xl list-disc space-y-2 pl-5 text-left font-sans text-sm font-semibold leading-relaxed text-foreground/90 sm:space-y-2.5 sm:pl-6 sm:text-base md:text-lg md:leading-relaxed xl:text-xl">
              {slide.trailBullets.map((item, i) => (
                <li
                  key={`trail-b-${i}-${item.slice(0, 24)}`}
                  className="pl-1 marker:text-brutal-hot"
                >
                  {linkifyHttpUrls(item)}
                </li>
              ))}
            </ul>
          ) : null}
          {slide.image ? (
            <div
              className={
                slide.image.frameClass
                  ? `mb-8 w-full shrink-0 sm:mb-10 md:mb-12 ${slide.image.frameClass}`
                  : "mb-8 w-full max-w-5xl shrink-0 sm:mb-10 md:mb-12"
              }
            >
              <BlurUpImage
                src={slide.image.src}
                alt={slide.image.alt}
                ratioClass={slide.image.ratioClass ?? "aspect-[3/2] w-full"}
                sizes={slide.image.sizes ?? "(max-width: 1024px) 100vw, 896px"}
                wrapperClassName="border-[3px] border-foreground bg-foreground brutal-shadow"
              />
              {slide.image.caption ? (
                <p className="mt-2 pb-3 font-sans text-sm font-semibold text-foreground/85 sm:mt-3 sm:pb-4 sm:text-base md:pb-5">
                  {slide.image.caption}
                </p>
              ) : null}
            </div>
          ) : null}
          {mid === null ? ctasEl : null}
        </div>
      );
    }

    case "media": {
      const aspect =
        slide.variant === "square"
          ? "aspect-square max-w-2xl"
          : slide.variant === "tall"
            ? "aspect-[3/4] max-w-md"
            : "aspect-video max-w-5xl";
      return (
        <div className="mb-8 flex min-h-0 flex-col justify-start gap-3 py-2 sm:mb-10 sm:gap-4 sm:py-2 md:mb-12 md:gap-6 md:py-3">
          {slide.heading ? (
            <h2 className="font-heading text-xl font-bold leading-tight tracking-tight text-balance sm:text-2xl md:text-4xl lg:text-5xl">
              {slide.heading}
            </h2>
          ) : null}
          {slide.ctas && slide.ctas.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {slide.ctas.map((cta, i) => {
                const openInNewTab = /^https?:\/\//i.test(cta.href);
                return (
                  <a
                    key={`${cta.href}-${i}`}
                    className="brutal-pressable inline-flex w-fit items-center gap-2 border-[3px] border-foreground bg-brutal-accent px-3 py-2 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow sm:px-5 sm:py-2.5 sm:text-sm"
                    href={cta.href}
                    {...(openInNewTab
                      ? { target: "_blank" as const, rel: "noopener noreferrer" }
                      : {})}
                  >
                    {cta.label}
                  </a>
                );
              })}
            </div>
          ) : null}
          <BlurUpImage
            src={slide.src}
            alt={slide.alt}
            ratioClass={aspect}
            sizes="(max-width: 1024px) 100vw, 896px"
            wrapperClassName="border-[3px] border-foreground bg-foreground brutal-shadow"
          />
          {slide.caption ? (
            <p className="pb-3 font-sans text-sm font-semibold text-foreground/85 sm:pb-4 md:pb-5 md:text-base">
              {slide.caption}
            </p>
          ) : null}
        </div>
      );
    }

    case "iframe": {
      const aspect = slide.aspectClass ?? "aspect-video";
      return (
        <div className="flex min-h-0 flex-col justify-start gap-3 py-2 sm:gap-4 sm:py-2 md:py-3">
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
        <div className="flex min-h-0 flex-col justify-start gap-4 py-2 sm:gap-5 sm:py-2 md:gap-8 md:py-3">
          {slide.heading ? (
            <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl md:text-4xl lg:text-5xl">
              {slide.heading}
            </h2>
          ) : null}
          <ol className="relative grid gap-4 border-l-[3px] border-foreground pl-6 sm:gap-5 sm:pl-7 md:gap-8 md:pl-8">
            {slide.items.map((item) => (
              <li key={`${item.period}-${item.title}`} className="relative">
                <span className="absolute top-1.5 left-[calc(-1.5rem-1.5px-0.375rem)] h-3 w-3 border-2 border-foreground bg-brutal-accent brutal-shadow-sm sm:top-2 sm:left-[calc(-1.75rem-1.5px-0.5rem)] sm:h-4 sm:w-4 md:left-[calc(-2rem-1.5px-0.5rem)]" />
                <p className="font-sans text-[10px] font-extrabold uppercase tracking-wider text-brutal-hot sm:text-xs sm:tracking-widest">
                  {item.period}
                </p>
                <h3 className="font-heading mt-0.5 text-lg font-bold sm:mt-1 sm:text-xl md:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-3xl font-sans text-sm font-semibold leading-relaxed text-foreground/88 sm:mt-3 sm:text-base">
                  {linkifyHttpUrls(item.body)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      );

    case "twoColumn": {
      const twoColLinkOpensNewTab = slide.left.link
        ? /^https?:\/\//i.test(slide.left.link.href)
        : false;
      return (
        <div className="flex min-h-0 w-full flex-1 flex-col gap-5 py-2 md:gap-6 md:py-2">
          <div className="flex min-w-0 shrink-0 flex-col gap-3 sm:gap-4 md:gap-5">
            {slide.left.heading || slide.left.link ? (
              <div
                className={`flex w-full items-start gap-3 sm:gap-4 ${slide.left.link ? "justify-between" : ""}`}
              >
                {slide.left.heading ? (
                  <h2
                    className={`font-heading text-lg font-bold tracking-tight sm:text-xl md:text-3xl lg:text-4xl ${slide.left.link ? "min-w-0 flex-1 pr-2 text-balance" : ""}`}
                  >
                    {slide.left.heading}
                  </h2>
                ) : (
                  <span className="min-w-0 flex-1" aria-hidden />
                )}
                {slide.left.link ? (
                  <a
                    className="brutal-pressable shrink-0 border-[3px] border-foreground bg-brutal-accent px-2.5 py-1.5 font-sans text-[10px] font-extrabold uppercase tracking-[0.14em] text-brutal-accent-fg brutal-shadow-sm sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
                    href={slide.left.link.href}
                    {...(twoColLinkOpensNewTab
                      ? { target: "_blank" as const, rel: "noopener noreferrer" }
                      : {})}
                  >
                    {slide.left.link.label}
                  </a>
                ) : null}
              </div>
            ) : null}
            <Prose>
              {slide.left.paragraphs.map((p, i) => (
                <p key={i}>{linkifyHttpUrls(p)}</p>
              ))}
            </Prose>
            {slide.left.ctas && slide.left.ctas.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-3 sm:mt-2">
                {slide.left.ctas.map((cta, i) => {
                  const openInNewTab = /^https?:\/\//i.test(cta.href);
                  return (
                    <a
                      key={`${cta.href}-${i}`}
                      className="brutal-pressable inline-flex w-fit items-center gap-2 border-[3px] border-foreground bg-brutal-accent px-3 py-2 font-sans text-xs font-extrabold uppercase tracking-wide text-brutal-accent-fg brutal-shadow sm:px-5 sm:py-2.5 sm:text-sm"
                      href={cta.href}
                      {...(openInNewTab
                        ? { target: "_blank" as const, rel: "noopener noreferrer" }
                        : {})}
                    >
                      {cta.label}
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
          {slide.right.kind === "image" ? (
            <div className="flex w-full shrink-0 flex-col gap-3 sm:gap-4">
              <BlurUpImage
                src={slide.right.src}
                alt={slide.right.alt}
                ratioClass={slide.right.ratioClass ?? "aspect-video"}
                sizes="(max-width: 1280px) 100vw, 1152px"
                wrapperClassName="border-[3px] border-foreground brutal-shadow"
              />
              {slide.right.caption ? (
                <p className="font-sans text-sm font-semibold text-foreground/75">{slide.right.caption}</p>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden border-[3px] border-foreground bg-foreground brutal-shadow">
              <iframe
                title={slide.right.title}
                src={slide.right.src}
                className="min-h-0 w-full flex-1 border-0 bg-background"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="fullscreen"
              />
            </div>
          )}
        </div>
      );
    }

    case "quote":
      return (
        <figure className="brutal-quote-box flex min-h-0 flex-col justify-start gap-4 border-[3px] border-foreground p-4 brutal-shadow sm:justify-center sm:gap-6 sm:p-6 md:gap-8 md:p-10">
          <blockquote className="font-heading text-xl font-bold leading-snug text-balance sm:text-2xl md:text-4xl md:leading-snug lg:text-5xl">
            «{slide.text}»
          </blockquote>
          {slide.attribution ? (
            <figcaption className="font-sans text-sm font-extrabold uppercase tracking-wide text-foreground/75 sm:text-base md:text-lg">
              — {slide.attribution}
            </figcaption>
          ) : null}
        </figure>
      );

    case "livePoll":
      return (
        <LivePollSlideContent
          slide={slide}
          slideIndex={slideIndex}
          activeSlideIndex={activeSlideIndex}
        />
      );
  }
}
