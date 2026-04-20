import { z } from "zod";
import type { StaticImageData } from "next/image";

const imagePathSchema = z.string().refine(
  (value) => value.startsWith("/") || /^https?:\/\//.test(value),
  "Expected a root-relative image path or absolute URL.",
);

const staticImageDataSchema = z.custom<StaticImageData>(
  (value) =>
    value != null &&
    typeof value === "object" &&
    typeof (value as StaticImageData).src === "string" &&
    typeof (value as StaticImageData).width === "number" &&
    typeof (value as StaticImageData).height === "number",
  "Expected a static image import.",
);

const imageSourceSchema = z.union([imagePathSchema, staticImageDataSchema]);

const imageRefSchema = z.object({
  src: imageSourceSchema,
  alt: z.string(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  /** Tailwind classes for BlurUpImage aspect box (default aspect-[3/4] w-full on section). */
  ratioClass: z.string().optional(),
  /** Section slide only: max-width wrapper around the image. */
  frameClass: z.string().optional(),
  /** Overrides default `sizes` for next/image. */
  sizes: z.string().optional(),
});

/** Plain string, small HTML fragment, or animated brutal chip (trusted deck content only). */
export const richTextLineSchema = z.union([
  z.string(),
  z.object({ html: z.string() }),
  z.object({
    brutalChip: z.object({
      label: z.string().min(1),
      /** If true, keep label casing (default: uppercase for neo-brutalist chips). */
      preserveCase: z.boolean().optional(),
    }),
  }),
]);

export type RichTextLine = z.infer<typeof richTextLineSchema>;

/** One prose block: a single rich line or multiple inline segments (e.g. text + brutal chip). */
const textParagraphSchema = z.union([
  richTextLineSchema,
  z.array(richTextLineSchema).min(1),
]);

export type TextParagraph = z.infer<typeof textParagraphSchema>;

const titleSublineSchema = z.union([
  richTextLineSchema,
  z.array(richTextLineSchema).min(1),
]);

const baseSlideSchema = z.object({
  id: z.string().optional(),
  notes: z.string().optional(),
});

const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
});

const titleSlideSchema = baseSlideSchema.extend({
  kind: z.literal("title"),
  title: z.string(),
  subline: titleSublineSchema.optional(),
  image: imageRefSchema.optional(),
});

const sectionImageSchema = imageRefSchema.extend({
  caption: z.string().optional(),
});

const sectionSlideSchema = baseSlideSchema.extend({
  kind: z.literal("section"),
  title: z.string(),
  kicker: z.string().optional(),
  subtitle: z.string().optional(),
  bullets: z.array(z.string().min(1)).optional(),
  image: sectionImageSchema.optional(),
  /** Renders after bullets, before optional image. */
  ctas: z.array(ctaSchema).optional(),
});

const textSlideImageSchema = imageRefSchema.extend({
  caption: z.string().optional(),
});

const textSlideSchema = baseSlideSchema.extend({
  kind: z.literal("text"),
  heading: z.string().optional(),
  paragraphs: z.array(textParagraphSchema).min(1),
  bullets: z.array(z.string().min(1)).optional(),
  /** Optional second prose + bullet block after `bullets` (e.g. second topic on one slide). */
  trailParagraphs: z.array(textParagraphSchema).optional(),
  trailBullets: z.array(z.string().min(1)).optional(),
  /** One or more brutal CTA buttons (e.g. social links). */
  ctas: z.array(ctaSchema).optional(),
  /** If set, CTAs render immediately after `paragraphs[index]` (0 = after first). If unset, CTAs render after all paragraphs and bullets. */
  ctasAfterParagraphIndex: z.number().int().min(0).optional(),
  image: textSlideImageSchema.optional(),
});

const mediaSlideSchema = baseSlideSchema.extend({
  kind: z.literal("media"),
  heading: z.string().optional(),
  src: imageSourceSchema,
  alt: z.string(),
  caption: z.string().optional(),
  variant: z.enum(["wide", "tall", "square"]).optional(),
  /** Renders above the image (after optional heading). */
  ctas: z.array(ctaSchema).optional(),
});

const iframeSlideSchema = baseSlideSchema.extend({
  kind: z.literal("iframe"),
  src: z.string().url(),
  title: z.string(),
  caption: z.string().optional(),
  aspectClass: z
    .enum(["aspect-video", "aspect-[4/3]", "aspect-square", "aspect-[21/9]"])
    .optional(),
});

const timelineItemSchema = z.object({
  period: z.string(),
  title: z.string(),
  body: z.string(),
});

const timelineSlideSchema = baseSlideSchema.extend({
  kind: z.literal("timeline"),
  heading: z.string().optional(),
  items: z.array(timelineItemSchema).min(1),
});

const twoColumnRightSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("image"),
    src: imageSourceSchema,
    alt: z.string(),
    caption: z.string().optional(),
    /** Tailwind aspect/size classes, e.g. aspect-[3/2] max-h-[min(58vh,720px)] */
    ratioClass: z.string().optional(),
  }),
  z.object({
    kind: z.literal("iframe"),
    src: z.string().url(),
    title: z.string(),
  }),
]);

const twoColumnSlideSchema = baseSlideSchema.extend({
  kind: z.literal("twoColumn"),
  left: z.object({
    heading: z.string().optional(),
    paragraphs: z.array(z.string()).min(1),
    link: ctaSchema.optional(),
    ctas: z.array(ctaSchema).optional(),
  }),
  right: twoColumnRightSchema,
});

const quoteSlideSchema = baseSlideSchema.extend({
  kind: z.literal("quote"),
  text: z.string(),
  attribution: z.string().optional(),
});

const livePollSlideSchema = baseSlideSchema.extend({
  kind: z.literal("livePoll"),
  kicker: z.string().optional(),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(8),
});

export const slideSchema = z.discriminatedUnion("kind", [
  titleSlideSchema,
  sectionSlideSchema,
  textSlideSchema,
  mediaSlideSchema,
  iframeSlideSchema,
  timelineSlideSchema,
  twoColumnSlideSchema,
  quoteSlideSchema,
  livePollSlideSchema,
]);

export const slidesSchema = z.array(slideSchema).min(1);

export type Slide = z.infer<typeof slideSchema>;
export type Slides = z.infer<typeof slidesSchema>;
