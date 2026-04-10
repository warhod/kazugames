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

function parseLegacyItemGrid($: CheerioAPI, baseUrl: string): SearchResult[] {
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
        image_url: image_url?.trim() || null,
        current_price: parsePriceText(current_price_text),
      });
    }
  });

  return results;
}

/**
 * Current DekuDeals search pages ship a server-rendered browse grid:
 * `.browse-cards.view-grid` with `a.main-link` to `/items/...`, title in `h6`,
 * cover `img[src]`, and sale price in `.text-tight strong` (MSRP in `s.text-muted` when discounted).
 */
function parseBrowseCardsGrid($: CheerioAPI, baseUrl: string): SearchResult[] {
  const results: SearchResult[] = [];

  $('.browse-cards.view-grid a.main-link[href*="/items/"]').each((_, el) => {
    const $link = $(el);
    const href = $link.attr("href")?.trim();
    if (!href) return;

    const title =
      $link.find("h6").first().text().trim() || $link.text().trim();
    if (!title) return;

    const raw_url = href.startsWith("http") ? href : baseUrl + href;
    const deku_url = normalizeDekuUrl(raw_url);

    const $col = $link.closest(".col");
    const image_src = $col.find("img[src]").first().attr("src")?.trim() ?? "";
    const image_url = image_src ? image_src : null;

    const current_price_text = $col.find(".text-tight strong").first().text();

    results.push({
      title,
      deku_url,
      image_url,
      current_price: parsePriceText(current_price_text),
    });
  });

  return results;
}

/**
 * Parse DekuDeals search result cards. Tries the legacy `.item-grid` markup first,
 * then the current browse grid (see `parseBrowseCardsGrid`).
 */
export function parseSearchResults(
  $: CheerioAPI,
  baseUrl: string,
): SearchResult[] {
  const legacy = parseLegacyItemGrid($, baseUrl);
  if (legacy.length > 0) {
    return legacy;
  }
  return parseBrowseCardsGrid($, baseUrl);
}
