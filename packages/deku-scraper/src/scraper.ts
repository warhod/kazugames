import * as cheerio from 'cheerio';
import { GameData, SearchResult } from './types';
import { parseGamePage } from './parsers/game-page';
import { parseSearchResults } from './parsers/search';

const DEKU_BASE_URL = 'https://www.dekudeals.com';

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
