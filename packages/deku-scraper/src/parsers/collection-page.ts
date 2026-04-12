import type { Cheerio, CheerioAPI } from "cheerio";
import type { CollectionImportGameStatusHint, CollectionItem } from "../types";
import { normalizeDekuUrl } from "./search";

/**
 * DekuDeals collection pages (`/collection/…`) render the same server-side browse grid as search:
 * `.browse-cards.view-grid` with `a.main-link` → `/items/{slug}`.
 *
 * **Pagination (v1 scraper):** the site uses relative links like `?page=2` on the same collection URL.
 * `scrapeCollection` can fetch multiple pages; callers should set a sensible `maxPages` cap (see scraper JSDoc).
 * Large libraries paginate in fixed-size chunks (often 120 items per page in the wild).
 */

function absoluteItemUrl(href: string, baseUrl: string): string {
  const raw = href.startsWith("http") ? href : baseUrl + href;
  return normalizeDekuUrl(raw);
}

function readDetailValue($detail: Cheerio<unknown>): string {
  const $clone = $detail.clone();
  $clone.find("small").remove();
  return $clone.text().replace(/\s+/g, " ").trim();
}

function extractStatusLabel(
  $: CheerioAPI,
  $col: Cheerio<unknown>,
): string | null {
  let found: string | null = null;
  $col.find(".watch-details .detail, .shared-details .detail").each((_, el) => {
    const $detail = $(el);
    const label = $detail
      .find("small.text-muted")
      .first()
      .text()
      .trim()
      .toLowerCase();
    if (label === "status") {
      const value = readDetailValue($detail);
      if (value) found = value;
      return false;
    }
  });
  return found;
}

/**
 * Parse a single collection HTML document into ordered items.
 * Reuses {@link normalizeDekuUrl} for canonical `/items/…` URLs (platform query stripped).
 */
export function parseCollectionPage(
  $: CheerioAPI,
  baseUrl: string,
): CollectionItem[] {
  const items: CollectionItem[] = [];

  $(".browse-cards.view-grid .col").each((_, col) => {
    const $col = $(col);
    const $link = $col.find('a.main-link[href*="/items/"]').first();
    const href = $link.attr("href")?.trim();
    if (!href) return;

    const title = $link.find("h6").first().text().trim() || $link.text().trim();
    if (!title) return;

    const deku_url = absoluteItemUrl(href, baseUrl);
    const deku_status_label = extractStatusLabel($, $col);

    items.push({ title, deku_url, deku_status_label });
  });

  return items;
}

/**
 * Maps DekuDeals collection card "Status" labels to our import hint type.
 *
 * | Deku label (case-insensitive) | Hint |
 * | ----------------------------- | ---- |
 * | Currently playing             | playing |
 * | Completed                     | completed |
 * | Abandoned                     | abandoned |
 * | Want to play                  | owned (v1: not wishlist — single merged library) |
 * | Missing / empty / unknown     | owned |
 */
export function mapDekuCollectionStatusLabel(
  label: string | null | undefined,
): CollectionImportGameStatusHint {
  const raw = (label ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!raw) return "owned";

  if (raw === "currently playing") {
    return "playing";
  }
  if (raw === "completed") {
    return "completed";
  }
  if (raw === "abandoned") {
    return "abandoned";
  }
  if (raw === "want to play") {
    return "owned";
  }

  return "owned";
}
