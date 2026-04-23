import { describe, expect, test } from 'bun:test';
import { isDekuItemUrl } from '@/lib/is-deku-item-url';

describe('isDekuItemUrl', () => {
  test('returns true for valid DekuDeals item URLs', () => {
    expect(isDekuItemUrl('https://www.dekudeals.com/items/mario-kart-8-deluxe')).toBe(true);
    expect(isDekuItemUrl('http://www.dekudeals.com/items/mario-kart-8-deluxe')).toBe(true);
    expect(isDekuItemUrl('www.dekudeals.com/items/mario-kart-8-deluxe')).toBe(true);
    expect(isDekuItemUrl('dekudeals.com/items/mario-kart-8-deluxe')).toBe(true);
    expect(isDekuItemUrl('https://dekudeals.com/items/mario-kart-8-deluxe')).toBe(true);
  });

  test('returns true for valid item URLs with query params or fragments', () => {
    expect(isDekuItemUrl('https://www.dekudeals.com/items/mario?utm_source=test')).toBe(true);
    expect(isDekuItemUrl('https://www.dekudeals.com/items/mario#reviews')).toBe(true);
  });

  test('returns false for empty or whitespace strings', () => {
    expect(isDekuItemUrl('')).toBe(false);
    expect(isDekuItemUrl('   ')).toBe(false);
  });

  test('returns false for non-item DekuDeals URLs', () => {
    expect(isDekuItemUrl('https://www.dekudeals.com/')).toBe(false);
    expect(isDekuItemUrl('https://www.dekudeals.com/games')).toBe(false);
    expect(isDekuItemUrl('https://www.dekudeals.com/hottest')).toBe(false);
  });

  test('returns false for non-DekuDeals URLs', () => {
    expect(isDekuItemUrl('https://google.com')).toBe(false);
    expect(isDekuItemUrl('https://amazon.com/items/123')).toBe(false);
    expect(isDekuItemUrl('https://nintendo.com')).toBe(false);
  });

  test('handles mixed case', () => {
    expect(isDekuItemUrl('HTTPS://WWW.DEKUDEALS.COM/ITEMS/MARIO')).toBe(true);
    expect(isDekuItemUrl('DEKUDEALS.COM/ITEMS/test')).toBe(true);
  });

  test('returns false for invalid URLs that do not contain the pattern', () => {
    expect(isDekuItemUrl('not-a-url')).toBe(false);
    expect(isDekuItemUrl('ftp://www.dekudeals.com/items/mario')).toBe(false);
  });

  test('permissive check: returns true if pattern is present and can be parsed as a valid URL', () => {
    expect(isDekuItemUrl('dekudeals.com/items/anything')).toBe(true);
  });

  test('handles URLs with leading/trailing whitespace', () => {
    expect(isDekuItemUrl('  https://www.dekudeals.com/items/mario  ')).toBe(true);
  });
});
