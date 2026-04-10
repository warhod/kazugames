import type { CheerioAPI } from 'cheerio';
import { GameData } from '../types';

function parsePriceText(raw: string): number | null {
  const text = raw.replace('$', '').trim();
  return text ? parseFloat(text) : null;
}

/** First USD-style amount in a cell (ignores trailing "CAD", badges, etc.). */
function extractUsdPrice(raw: string): number | null {
  const m = raw.match(/\$\s*([\d,]+\.?\d*)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function stripDekuTitleSuffix(title: string): string {
  return title.replace(/\s*\|\s*Deku Deals\s*$/i, '').trim();
}

function parseTitle($: CheerioAPI): string {
  const fromDom =
    $('.item-name').first().text().trim() ||
    $('.item-title').first().text().trim() ||
    $('h1').first().text().trim();

  if (fromDom) return fromDom;

  const og = $('meta[property="og:title"]').attr('content')?.trim();
  if (og) return stripDekuTitleSuffix(og);

  const docTitle = $('title').first().text().trim();
  if (docTitle) return stripDekuTitleSuffix(docTitle);

  return '';
}

function parseCurrentPrice($: CheerioAPI): number | null {
  const legacy = $('.price.current').first().text();
  const fromLegacy = parsePriceText(legacy);
  if (fromLegacy != null && !Number.isNaN(fromLegacy)) return fromLegacy;

  let found: number | null = null;
  $('table.item-price-table tr').each((_, tr) => {
    const $tr = $(tr);
    if ($tr.find('> td').length !== 3) return;
    const primaryBtn = $tr.find('> td').eq(2).find('div.btn-primary').first();
    if (!primaryBtn.length) return;
    const n = extractUsdPrice(primaryBtn.text());
    if (n != null) {
      found = n;
      return false;
    }
  });
  return found;
}

function parseMsrp($: CheerioAPI): number | null {
  const legacy = $('.price.msrp').first().text();
  const fromLegacy = parsePriceText(legacy);
  if (fromLegacy != null && !Number.isNaN(fromLegacy)) return fromLegacy;

  let fromDetails: number | null = null;
  $('ul.details-list li, ul.details li').each((_, el) => {
    const t = $(el).text();
    const m = t.match(/MSRP\s*:\s*\$?\s*([\d,]+\.?\d*)/i);
    if (m) {
      fromDetails = parseFloat(m[1].replace(/,/g, ''));
      return false;
    }
  });
  return fromDetails;
}

function parseDescription($: CheerioAPI): string {
  const fromCollapse =
    $('#descriptionCollapse .card-body').text().trim() ||
    $('#descriptionCollapse .description').text().trim();
  return fromCollapse || $('.item-description').text().trim();
}

function parsePlatform($: CheerioAPI): string {
  const label = $('.platform-label').first().text().trim();
  if (label) return label;

  let fromDetails: string | null = null;
  $('ul.details-list li, ul.details li').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const m = text.match(/Platforms?\s*:\s*(.+)$/i);
    if (m) {
      fromDetails = m[1].trim();
      return false;
    }
  });
  if (fromDetails) return fromDetails;

  return 'Switch';
}

/** Parse a DekuDeals item detail page (legacy `.price.*` markup and current `item-price-table` layout). */
export function parseGamePage($: CheerioAPI, url: string): GameData {
  const title = parseTitle($);
  const image_url = $('meta[property="og:image"]').attr('content') || null;

  return {
    title,
    deku_url: url,
    image_url,
    current_price: parseCurrentPrice($),
    msrp: parseMsrp($),
    description: parseDescription($) || null,
    platform: parsePlatform($),
  };
}
