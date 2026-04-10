import { describe, test, expect, beforeAll } from 'bun:test';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseGamePage } from '../src';

function loadFixture(html: string, url: string) {
  const $ = cheerio.load(html);
  return parseGamePage($, url);
}

const FIXTURE_URL = 'https://www.dekudeals.com/items/the-legend-of-zelda-tears-of-the-kingdom';
const MODERN_FIXTURE_URL =
  'https://www.dekudeals.com/items/metal-gear-solid-delta-snake-eater';
let fixtureHtml: string;
let modernFixtureHtml: string;

beforeAll(() => {
  fixtureHtml = readFileSync(
    join(import.meta.dir, 'fixtures/zelda-totk.html'),
    'utf-8'
  );
  modernFixtureHtml = readFileSync(
    join(import.meta.dir, 'fixtures/metal-gear-item-layout.html'),
    'utf-8'
  );
});

describe('scrapeGame — parsing logic', () => {
  test('extracts title', () => {
    const result = loadFixture(fixtureHtml, FIXTURE_URL);
    expect(result.title).toBe('The Legend of Zelda: Tears of the Kingdom');
  });

  test('extracts og:image as image_url', () => {
    const result = loadFixture(fixtureHtml, FIXTURE_URL);
    expect(result.image_url).toContain('dekudeals.com');
  });

  test('extracts current_price as a number', () => {
    const result = loadFixture(fixtureHtml, FIXTURE_URL);
    expect(result.current_price).toBe(51.99);
  });

  test('extracts msrp as a number', () => {
    const result = loadFixture(fixtureHtml, FIXTURE_URL);
    expect(result.msrp).toBe(69.99);
  });

  test('extracts description', () => {
    const result = loadFixture(fixtureHtml, FIXTURE_URL);
    expect(result.description).toContain('Hyrule');
  });

  test('extracts platform label', () => {
    const result = loadFixture(fixtureHtml, FIXTURE_URL);
    expect(result.platform).toBe('Switch');
  });

  test('sets deku_url from input', () => {
    const result = loadFixture(fixtureHtml, FIXTURE_URL);
    expect(result.deku_url).toBe(FIXTURE_URL);
  });

  test('uses og:title when visible title nodes are absent', () => {
    const html = `<!DOCTYPE html><html><head>
      <meta property="og:title" content="Fallback From OG | Deku Deals" />
      <title>Unused | Deku Deals</title>
    </head><body></body></html>`;
    const result = loadFixture(html, FIXTURE_URL);
    expect(result.title).toBe('Fallback From OG');
  });

  test('uses document title when only title tag has the name', () => {
    const html = `<!DOCTYPE html><html><head>
      <title>Title Tag Only | Deku Deals</title>
    </head><body></body></html>`;
    const result = loadFixture(html, FIXTURE_URL);
    expect(result.title).toBe('Title Tag Only');
  });
});

describe('parseGamePage — modern item layout (item-price-table)', () => {
  test('extracts title from .item-title', () => {
    const result = loadFixture(modernFixtureHtml, MODERN_FIXTURE_URL);
    expect(result.title).toBe('METAL GEAR SOLID Δ: SNAKE EATER');
  });

  test('extracts current_price from first primary button in price table', () => {
    const result = loadFixture(modernFixtureHtml, MODERN_FIXTURE_URL);
    expect(result.current_price).toBe(29.85);
  });

  test('extracts msrp from details list', () => {
    const result = loadFixture(modernFixtureHtml, MODERN_FIXTURE_URL);
    expect(result.msrp).toBe(69.99);
  });

  test('extracts description from #descriptionCollapse .description', () => {
    const result = loadFixture(modernFixtureHtml, MODERN_FIXTURE_URL);
    expect(result.description).toContain('METAL GEAR SOLID 3');
  });

  test('extracts platform line from details list', () => {
    const result = loadFixture(modernFixtureHtml, MODERN_FIXTURE_URL);
    expect(result.platform).toContain('PlayStation 5');
    expect(result.platform).toContain('Steam');
  });
});
