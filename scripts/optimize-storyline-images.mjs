#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "docs", "storyline", "assets");
/** Skip tiny JPEG/PNG sources — avoids turning solid-colour placeholders into “empty” WebPs. */
const minInputBytes = 15_000;
/** Warn when output is suspiciously small for a large frame (likely flat placeholder). */
const minOutputBytesForLargeFrame = 12_000;
const largeFramePixels = 400 * 400;
const supportedExtensions = new Set([
  ".avif",
  ".gif",
  ".heic",
  ".heif",
  ".jpeg",
  ".jpg",
  ".png",
  ".tif",
  ".tiff",
]);
const maxEdge = 2400;
/** When `slide4.jpg` is absent or tiny, build Folie 4 from this master (change if you rename the file). */
const slide4MasterName = "20250411_DSCF0397_MD.jpg";

function walkFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }

  return files;
}

function isOptimizableImage(path) {
  return supportedExtensions.has(extname(path).toLowerCase());
}

async function optimizeImage(sourcePath) {
  const relativePath = relative(sourceDir, sourcePath);
  const outputPath = join(sourceDir, relativePath).replace(/\.[^.]+$/u, ".webp");

  mkdirSync(dirname(outputPath), { recursive: true });

  const inputBytes = statSync(sourcePath).size;
  if (inputBytes < minInputBytes) {
    console.warn(
      `[skip] ${relativePath} (${inputBytes} B < ${minInputBytes} B) — not a real photo? Replace the file or remove it; existing .webp left unchanged.`,
    );
    return { outputPath, relativePath, skipped: true };
  }

  const input = sharp(sourcePath, { animated: false }).rotate();
  const metadata = await input.metadata();

  const width = metadata.width ?? maxEdge;
  const height = metadata.height ?? maxEdge;

  await input
    .resize({
      width: width >= height ? Math.min(width, maxEdge) : undefined,
      height: height > width ? Math.min(height, maxEdge) : undefined,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      alphaQuality: 85,
      effort: 6,
      quality: 82,
    })
    .toFile(outputPath);

  const outMeta = await sharp(outputPath).metadata();
  const outBytes = statSync(outputPath).size;
  const px = (outMeta.width ?? 0) * (outMeta.height ?? 0);
  if (px >= largeFramePixels && outBytes < minOutputBytesForLargeFrame) {
    console.warn(
      `[warn] ${relative(sourceDir, outputPath)} (${outBytes} B) is very small for ${outMeta.width}×${outMeta.height} — check for solid-colour placeholders.`,
    );
  }

  return {
    outputPath,
    relativePath,
    skipped: false,
  };
}

async function writeWebpFromSource(sourcePath, outputPath) {
  const input = sharp(sourcePath, { animated: false }).rotate();
  const metadata = await input.metadata();
  const width = metadata.width ?? maxEdge;
  const height = metadata.height ?? maxEdge;
  await input
    .resize({
      width: width >= height ? Math.min(width, maxEdge) : undefined,
      height: height > width ? Math.min(height, maxEdge) : undefined,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      alphaQuality: 85,
      effort: 6,
      quality: 82,
    })
    .toFile(outputPath);
}

/**
 * Folie 4: prefer `slide4.jpg` (handled in the main loop). If missing / too small,
 * generate `slide4.webp` from the master photo so the deck never ships a flat placeholder.
 */
async function ensureSlide4Webp() {
  const slide4Jpg = join(sourceDir, "slide4.jpg");
  if (existsSync(slide4Jpg) && statSync(slide4Jpg).size >= minInputBytes) {
    return;
  }
  const master = join(sourceDir, slide4MasterName);
  if (!existsSync(master) || statSync(master).size < minInputBytes) {
    console.warn(
      `[deck] slide4.webp: add a real slide4.jpg (>${minInputBytes} B) or keep ${slide4MasterName} in assets.`,
    );
    return;
  }
  const outputPath = join(sourceDir, "slide4.webp");
  await writeWebpFromSource(master, outputPath);
  console.log(`${slide4MasterName} -> ${relative(root, outputPath)} (deck Folie 4)`);
}

async function main() {
  const files = walkFiles(sourceDir).filter(isOptimizableImage);

  if (files.length === 0) {
    console.log("No storyline images found in docs/storyline/assets.");
    console.log("Add .jpg/.png files there, then re-run this script.");
    return;
  }

  console.log(`Optimizing ${files.length} storyline image(s) to WebP...`);

  let skipped = 0;
  for (const file of files) {
    const result = await optimizeImage(file);
    if (result.skipped) {
      skipped += 1;
      continue;
    }
    console.log(
      `${result.relativePath} -> ${relative(root, result.outputPath)}`,
    );
  }

  await ensureSlide4Webp();

  console.log("");
  console.log("Done.");
  if (skipped > 0) {
    console.log(`${skipped} file(s) skipped (see warnings above).`);
  }
  console.log("Import optimized .webp files directly from docs/storyline/assets.");
}

await main();
