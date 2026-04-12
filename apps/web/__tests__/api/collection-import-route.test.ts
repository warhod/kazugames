import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

const scrapeCollection = mock(() => Promise.resolve([] as never[]));

/** Provide full surface so `mock.module` does not clobber `deku-scraper` for other test files in the same run. */
mock.module('deku-scraper', () => ({
  scrapeGame: mock(() => Promise.resolve(null)),
  scrapeSearch: mock(() => Promise.resolve([] as never[])),
  scrapeCollection,
  normalizeDekuUrl: (u: string) => u,
  mapDekuCollectionStatusLabel: () => 'owned' as const,
  MAX_COLLECTION_SCRAPE_PAGES: 50,
  parseCollectionPage: mock(() => []),
  parseSearchResults: mock(() => []),
  parseGamePage: mock(() => null),
}));

describe('POST /api/collection/import', () => {
  test('returns 401 when not authenticated', async () => {
    currentMock = createQueuedSupabaseMock(null, []);
    const { POST } = await import('@/app/api/collection/import/route');
    const req = new NextRequest('http://localhost/api/collection/import', {
      method: 'POST',
      body: JSON.stringify({
        collection_url: 'https://www.dekudeals.com/collection/abc',
      }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test('returns 400 when collection_url missing', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { POST } = await import('@/app/api/collection/import/route');
    const req = new NextRequest('http://localhost/api/collection/import', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('returns 400 when URL is not a Deku collection page', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { POST } = await import('@/app/api/collection/import/route');
    const req = new NextRequest('http://localhost/api/collection/import', {
      method: 'POST',
      body: JSON.stringify({ collection_url: 'https://example.com/foo' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('returns counts when scrape yields no items', async () => {
    scrapeCollection.mockImplementation(() => Promise.resolve([]));
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { POST } = await import('@/app/api/collection/import/route');
    const req = new NextRequest('http://localhost/api/collection/import', {
      method: 'POST',
      body: JSON.stringify({
        collection_url: 'https://www.dekudeals.com/collection/xrxhry5c7q',
      }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imported).toBe(0);
    expect(body.skipped).toBe(0);
    expect(body.failed).toBe(0);
  });
});
