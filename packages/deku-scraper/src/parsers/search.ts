import type { CheerioAPI } from "cheerio";
import { SearchResult } from "../types";

function parsePriceText(raw: string): number | null {
  const text = raw.replace("$", "").trim();
  return text ? parseFloat(text) : null;
}

/**
 * Normalize a DekuDeals item URL to its canonical form.
 * Platform is a query parameter on DekuDeals (e.g. ?platform=ps5)
 * Strip it so we always store a clean, platform-agnostic URL.
 *   https://www.dekudeals.com/items/hollow-knight?platform=switch → https://www.dekudeals.com/items/hollow-knight
 */
export function normalizeDekuUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

/** Parse DekuDeals search results grid (same `.price.current` convention as item pages). */
export function parseSearchResults(
  $: CheerioAPI,
  baseUrl: string,
): SearchResult[] {
  const results: SearchResult[] = [];

  $(".item-grid .cell").each((_, el) => {
    const $el = $(el);
    const title = $el.find(".name").text().trim();
    const relative_url = $el.find("a").attr("href");
    const raw_url = relative_url
      ? relative_url.startsWith("http")
        ? relative_url
        : baseUrl + relative_url
      : "";
    const deku_url = raw_url ? normalizeDekuUrl(raw_url) : "";
    const image_url = $el.find(".main-image img").attr("src") || null;
    const current_price_text = $el.find(".price.current").text();

    if (title && deku_url) {
      results.push({
        title,
        deku_url,
        image_url,
        current_price: parsePriceText(current_price_text),
      });
    }
  });

  return results;
}
