import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

const scrapeGame = mock(() => Promise.resolve(null as null));
const scrapeSearch = mock(() => Promise.resolve([] as never[]));
const normalizeDekuUrl = mock((url: string) => url);

mock.module('deku-scraper', () => ({
  scrapeGame,
  scrapeSearch,
  normalizeDekuUrl,
}));

describe('GET /api/games', () => {
  test('400 when neither q nor url', async () => {
    currentMock = createQueuedSupabaseMock(null, []);
    const { GET } = await import('@/app/api/games/route');
    const req = new NextRequest('http://localhost/api/games');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  test('returns fresh cache hit by url without scraping', async () => {
    const cached = {
      id: '1',
      deku_url: 'https://x/items/foo',
      title: 'Foo',
      updated_at: new Date().toISOString(),
    };
    currentMock = createQueuedSupabaseMock(null, [
      { data: cached, error: null },
      { data: cached, error: null },
    ]);
    scrapeGame.mockClear();
    const { GET } = await import('@/app/api/games/route');
    const req = new NextRequest(
      `http://localhost/api/games?url=${encodeURIComponent(cached.deku_url)}`,
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(cached);
    expect(scrapeGame).not.toHaveBeenCalled();
  });

  test('returns search results from scraper when DB empty', async () => {
    currentMock = createQueuedSupabaseMock(null, [{ data: [], error: null }]);
    scrapeSearch.mockImplementation(() =>
      Promise.resolve([{ title: 'Hit', deku_url: 'https://x/items/hit' }]),
    );
    const { GET } = await import('@/app/api/games/route');
    const req = new NextRequest('http://localhost/api/games?q=zelda');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe('Hit');
  });

  test('502 when scrape succeeds but title is empty and there is no cache', async () => {
    currentMock = createQueuedSupabaseMock(null, [{ data: null, error: null }]);
    scrapeGame.mockImplementation(() =>
      Promise.resolve({
        title: '',
        deku_url: 'https://x/items/bad',
        image_url: 'https://img.example/x.png',
        current_price: null,
        msrp: null,
        description: null,
        platform: 'Switch',
      }),
    );
    const { GET } = await import('@/app/api/games/route');
    const req = new NextRequest(
      `http://localhost/api/games?url=${encodeURIComponent('https://x/items/bad')}`,
    );
    const res = await GET(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain('missing title');
  });

  test('returns stale cache when scrape is incomplete so bad rows are not upserted', async () => {
    const stale = {
      id: '1',
      deku_url: 'https://x/items/foo',
      title: 'Cached Foo',
      updated_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    };
    currentMock = createQueuedSupabaseMock(null, [
      { data: stale, error: null },
      { data: stale, error: null },
    ]);
    scrapeGame.mockImplementation(() =>
      Promise.resolve({
        title: '   ',
        deku_url: stale.deku_url,
        image_url: null,
        current_price: null,
        msrp: null,
        description: null,
        platform: 'Switch',
      }),
    );
    const { GET } = await import('@/app/api/games/route');
    const req = new NextRequest(
      `http://localhost/api/games?url=${encodeURIComponent(stale.deku_url)}`,
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(stale);
  });
});
