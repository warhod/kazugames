import * as cheerio from 'cheerio';
import { CollectionItem, GameData, SearchResult } from './types';
import { parseCollectionPage } from './parsers/collection-page';
import { parseGamePage } from './parsers/game-page';
import { parseSearchResults } from './parsers/search';

const DEKU_BASE_URL = 'https://www.dekudeals.com';

/**
 * Default `maxPages` for {@link scrapeCollection}: first page only unless callers pass a higher limit.
 * Full imports should pass a larger value (still bounded by {@link MAX_COLLECTION_SCRAPE_PAGES}).
 */
export const DEFAULT_COLLECTION_SCRAPE_MAX_PAGES = 1;

/** Hard ceiling so a bug or huge library cannot unboundedly fetch in one call. */
export const MAX_COLLECTION_SCRAPE_PAGES = 50;

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
} as const;

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.text();
}

export async function scrapeGame(url: string): Promise<GameData | null> {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    return parseGamePage($, url);
  } catch (error) {
    console.error('Error scraping game:', error);
    return null;
  }
}

/**
 * Fetches `/search?q=…` and parses the HTML with Cheerio.
 * DekuDeals includes the result grid in the initial response (not CSR-only); if the
 * markup changes again, update `parseSearchResults` in `./parsers/search`.
 */
export async function scrapeSearch(query: string): Promise<SearchResult[]> {
  try {
    const searchUrl = `${DEKU_BASE_URL}/search?q=${encodeURIComponent(query)}`;
    const html = await fetchHtml(searchUrl);
    const $ = cheerio.load(html);
    return parseSearchResults($, DEKU_BASE_URL);
  } catch (error) {
    console.error('Error searching games:', error);
    return [];
  }
}

export type ScrapeCollectionOptions = {
  /**
   * How many `?page=` chunks to fetch (Deku paginates the same collection URL).
   * Defaults to {@link DEFAULT_COLLECTION_SCRAPE_MAX_PAGES} (first page only for v1).
   */
  maxPages?: number;
};

/**
 * Fetches one or more HTML pages for a DekuDeals collection URL and parses each with {@link parseCollectionPage}.
 * Stops early when a page yields zero items. Results are concatenated in order across pages.
 */
export async function scrapeCollection(
  collectionUrl: string,
  options?: ScrapeCollectionOptions,
): Promise<CollectionItem[]> {
  const maxPages = Math.min(
    options?.maxPages ?? DEFAULT_COLLECTION_SCRAPE_MAX_PAGES,
    MAX_COLLECTION_SCRAPE_PAGES,
  );

  const all: CollectionItem[] = [];

  try {
    const base = new URL(collectionUrl);
    base.hash = '';

    for (let page = 1; page <= maxPages; page++) {
      const pageUrl = new URL(base.toString());
      pageUrl.searchParams.set('page', String(page));

      const html = await fetchHtml(pageUrl.toString());
      const $ = cheerio.load(html);
      const batch = parseCollectionPage($, DEKU_BASE_URL);
      if (batch.length === 0) {
        break;
      }
      all.push(...batch);
    }

    return all;
  } catch (error) {
    console.error('Error scraping collection:', error);
    return [];
  }
}
