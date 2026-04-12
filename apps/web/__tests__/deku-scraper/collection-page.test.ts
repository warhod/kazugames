import { describe, test, expect, afterEach } from 'bun:test';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  mapDekuCollectionStatusLabel,
  parseCollectionPage,
} from '../../lib/deku-scraper/parsers/collection-page';
import {
  DEFAULT_COLLECTION_SCRAPE_MAX_PAGES,
  scrapeCollection,
} from '../../lib/deku-scraper/scraper';

const DEKU_BASE = 'https://www.dekudeals.com';

function loadCollectionFixture(html: string) {
  const $ = cheerio.load(html);
  return parseCollectionPage($, DEKU_BASE);
}

describe('parseCollectionPage — fixture', () => {
  const html = readFileSync(
    join(import.meta.dir, 'fixtures/collection-browse-grid.html'),
    'utf-8',
  );

  test('returns items in DOM order with titles and canonical URLs', () => {
    const items = loadCollectionFixture(html);
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({
      title: 'Hollow Knight',
      deku_url: 'https://www.dekudeals.com/items/hollow-knight',
      deku_status_label: 'Currently playing',
    });
    expect(items[1]?.deku_url).toBe('https://www.dekudeals.com/items/celeste');
    expect(items[1]?.deku_status_label).toBe('Want to play');
    expect(items[2]).toEqual({
      title: 'Dead Cells',
      deku_url: 'https://www.dekudeals.com/items/dead-cells',
      deku_status_label: null,
    });
  });
});

describe('parseCollectionPage — edge cases', () => {
  test('returns empty when browse grid is absent', () => {
    const html = '<html><body><p>no grid</p></body></html>';
    expect(loadCollectionFixture(html)).toEqual([]);
  });

  test('skips columns without an /items/ main link', () => {
    const html = `
      <div class="browse-cards view-grid">
        <div class="row">
          <div class="col"><a class="main-link" href="/games">Browse</a></div>
          <div class="col">
            <a class="main-link" href="/items/ok-game"><h6>OK</h6></a>
          </div>
        </div>
      </div>`;
    const items = loadCollectionFixture(html);
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe('OK');
  });
});

describe('mapDekuCollectionStatusLabel', () => {
  test('maps known Deku labels per import contract', () => {
    expect(mapDekuCollectionStatusLabel('Currently playing')).toBe('playing');
    expect(mapDekuCollectionStatusLabel('completed')).toBe('completed');
    expect(mapDekuCollectionStatusLabel('Abandoned')).toBe('abandoned');
    expect(mapDekuCollectionStatusLabel('Want to play')).toBe('owned');
    expect(mapDekuCollectionStatusLabel(null)).toBe('owned');
    expect(mapDekuCollectionStatusLabel('')).toBe('owned');
    expect(mapDekuCollectionStatusLabel('Missing')).toBe('owned');
  });
});

describe('scrapeCollection', () => {
  const origFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = origFetch;
  });

  test('fetches multiple pages until a page parses to zero items', async () => {
    const html = readFileSync(
      join(import.meta.dir, 'fixtures/collection-browse-grid.html'),
      'utf-8',
    );

    globalThis.fetch = async (input: RequestInfo | URL) => {
      const u = String(input);
      if (u.includes('page=2')) {
        return new Response('<html><body></body></html>', { status: 200 });
      }
      return new Response(html, { status: 200 });
    };

    const items = await scrapeCollection('https://www.dekudeals.com/collection/xq36r9pjc5', {
      maxPages: 5,
    });
    expect(items).toHaveLength(3);
  });

  test('respects DEFAULT_COLLECTION_SCRAPE_MAX_PAGES when maxPages omitted', async () => {
    let callCount = 0;
    globalThis.fetch = async () => {
      callCount += 1;
      return new Response(
        readFileSync(
          join(import.meta.dir, 'fixtures/collection-browse-grid.html'),
          'utf-8',
        ),
        { status: 200 },
      );
    };

    await scrapeCollection('https://www.dekudeals.com/collection/abc');
    expect(callCount).toBe(DEFAULT_COLLECTION_SCRAPE_MAX_PAGES);
  });
});
