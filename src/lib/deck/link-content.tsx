import type { ReactNode } from "react";

/**
 * Trusted deck author HTML only: ensures external http(s) anchors open in a new tab.
 */
export function prepareTrustedHtmlLinks(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_, rawAttrs: string) => {
    const attrs = rawAttrs.trim();
    const hrefMatch =
      /\bhref\s*=\s*"([^"]*)"/i.exec(attrs) ??
      /\bhref\s*=\s*'([^']*)'/i.exec(attrs) ??
      /\bhref\s*=\s*([^\s>]+)/i.exec(attrs);
    const href = hrefMatch?.[1]?.trim() ?? "";
    if (!href || href.startsWith("#")) {
      return `<a ${attrs}>`;
    }
    if (!/^https?:\/\//i.test(href)) {
      return `<a ${attrs}>`;
    }

    let next = attrs;
    if (/\btarget\s*=/i.test(next)) {
      next = next.replace(/\btarget\s*=\s*(["'])[^"']*\1/i, 'target="_blank"');
    } else {
      next = `${next} target="_blank"`.trim();
    }
    if (/\brel\s*=/i.test(next)) {
      next = next.replace(/\brel\s*=\s*(["'])([^"']*)\1/i, (__, q, relVal) => {
        const parts = new Set(
          String(relVal)
            .split(/\s+/)
            .filter(Boolean),
        );
        parts.add("noopener");
        parts.add("noreferrer");
        return `rel=${q}${[...parts].join(" ")}${q}`;
      });
    } else {
      next = `${next} rel="noopener noreferrer"`.trim();
    }
    return `<a ${next}>`;
  });
}

const HTTP_URL_RE = /\bhttps?:\/\/[^\s<>"'()[\]{}]+/gi;

/**
 * Turns raw http(s) URLs in plain text into external links (deck content only).
 */
export function linkifyHttpUrls(text: string): ReactNode {
  const segments: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = HTTP_URL_RE.exec(text)) !== null) {
    if (m.index > last) {
      segments.push(text.slice(last, m.index));
    }
    const raw = m[0];
    const trailMatch = raw.match(/[.,;:!?)]+$/);
    const url = trailMatch ? raw.slice(0, -trailMatch[0].length) : raw;
    const afterUrl = trailMatch ? trailMatch[0] : "";
    segments.push(
      <a
        key={`u-${key++}-${url.slice(0, 28)}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold underline decoration-2 underline-offset-[0.15em]"
      >
        {url}
      </a>,
    );
    if (afterUrl) {
      segments.push(afterUrl);
    }
    last = m.index + raw.length;
  }
  if (!segments.length) {
    return text;
  }
  if (last < text.length) {
    segments.push(text.slice(last));
  }
  return <>{segments}</>;
}
