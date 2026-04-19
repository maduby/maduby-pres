import { z } from "zod";

const imageRefSchema = z.object({
  src: z.string().url(),
  alt: z.string(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

const baseSlideSchema = z.object({
  id: z.string().optional(),
  notes: z.string().optional(),
});

const titleSlideSchema = baseSlideSchema.extend({
  kind: z.literal("title"),
  title: z.string(),
  subline: z.string().optional(),
  image: imageRefSchema.optional(),
});

const sectionSlideSchema = baseSlideSchema.extend({
  kind: z.literal("section"),
  title: z.string(),
  kicker: z.string().optional(),
});

const textSlideSchema = baseSlideSchema.extend({
  kind: z.literal("text"),
  heading: z.string().optional(),
  paragraphs: z.array(z.string()).min(1),
});

const mediaSlideSchema = baseSlideSchema.extend({
  kind: z.literal("media"),
  src: z.string().url(),
  alt: z.string(),
  caption: z.string().optional(),
  credit: z.string().optional(),
  variant: z.enum(["wide", "tall", "square"]).optional(),
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
    src: z.string().url(),
    alt: z.string(),
    caption: z.string().optional(),
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
  }),
  right: twoColumnRightSchema,
});

const quoteSlideSchema = baseSlideSchema.extend({
  kind: z.literal("quote"),
  text: z.string(),
  attribution: z.string().optional(),
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
]);

export const slidesSchema = z.array(slideSchema).min(1);

export type Slide = z.infer<typeof slideSchema>;
export type Slides = z.infer<typeof slidesSchema>;
