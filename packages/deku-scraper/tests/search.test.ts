import { describe, test, expect, beforeAll } from 'bun:test';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseSearchResults } from '../src';

const DEKU_BASE = 'https://www.dekudeals.com';

function loadSearchFixture(html: string, baseUrl: string = DEKU_BASE) {
  const $ = cheerio.load(html);
  return parseSearchResults($, baseUrl);
}

let fixtureHtml: string;
let browseGridFixtureHtml: string;

beforeAll(() => {
  fixtureHtml = readFileSync(
    join(import.meta.dir, 'fixtures/search-zelda.html'),
    'utf-8'
  );
  browseGridFixtureHtml = readFileSync(
    join(import.meta.dir, 'fixtures/search-browse-grid.html'),
    'utf-8'
  );
});

describe('parseSearchResults — fixture', () => {
  test('extracts titles in DOM order', () => {
    const results = loadSearchFixture(fixtureHtml);
    expect(results.map((r) => r.title)).toEqual([
      'The Legend of Zelda: Tears of the Kingdom',
      'The Legend of Zelda: Breath of the Wild',
      "The Legend of Zelda: Link's Awakening",
    ]);
  });

  test('assembles absolute URL from relative href', () => {
    const results = loadSearchFixture(fixtureHtml);
    const totk = results.find((r) => r.title.includes('Tears of the Kingdom'));
    expect(totk?.deku_url).toBe(
      'https://www.dekudeals.com/items/the-legend-of-zelda-tears-of-the-kingdom'
    );
  });

  test('preserves already-absolute href', () => {
    const results = loadSearchFixture(fixtureHtml);
    const botw = results.find((r) => r.title.includes('Breath of the Wild'));
    expect(botw?.deku_url).toBe(
      'https://www.dekudeals.com/items/the-legend-of-zelda-breath-of-the-wild'
    );
  });

  test('parses numeric prices from .price.current', () => {
    const results = loadSearchFixture(fixtureHtml);
    const totk = results.find((r) => r.title.includes('Tears of the Kingdom'));
    const botw = results.find((r) => r.title.includes('Breath of the Wild'));
    expect(totk?.current_price).toBe(51.99);
    expect(botw?.current_price).toBe(39.99);
  });

  test('extracts image src when present', () => {
    const results = loadSearchFixture(fixtureHtml);
    const totk = results.find((r) => r.title.includes('Tears of the Kingdom'));
    expect(totk?.image_url).toBe('https://www.dekudeals.com/images/items/1234.jpg');
  });

  test('uses null for empty price and empty image src', () => {
    const results = loadSearchFixture(fixtureHtml);
    const la = results.find((r) => r.title.includes("Link's Awakening"));
    expect(la?.current_price).toBeNull();
    expect(la?.image_url).toBeNull();
  });
});

describe('parseSearchResults — browse grid fixture (live Deku layout)', () => {
  test('extracts titles, URLs, images, and sale price from strong', () => {
    const results = loadSearchFixture(browseGridFixtureHtml);
    expect(results).toHaveLength(2);
    const botw = results.find((r) => r.title.includes('Breath of the Wild'));
    expect(botw?.deku_url).toBe(
      'https://www.dekudeals.com/items/the-legend-of-zelda-breath-of-the-wild'
    );
    expect(botw?.image_url).toBe('https://cdn.dekudeals.com/images/botw.jpg');
    expect(botw?.current_price).toBe(43.99);
    const totk = results.find((r) => r.title.includes('Tears of the Kingdom'));
    expect(totk?.current_price).toBe(69.99);
    expect(totk?.image_url).toBe('https://cdn.dekudeals.com/images/totk.jpg');
  });
});

describe('parseSearchResults — edge cases', () => {
  test('returns empty array when grid has no cells and no browse cards', () => {
    const html = '<div class="item-grid"></div>';
    expect(loadSearchFixture(html)).toEqual([]);
  });

  test('skips cells missing title or link', () => {
    const html = `
      <div class="item-grid">
        <div class="cell">
          <div class="name">No Link Here</div>
        </div>
        <div class="cell">
          <a href="/items/only-link"></a>
        </div>
      </div>
    `;
    expect(loadSearchFixture(html)).toEqual([]);
  });
});
