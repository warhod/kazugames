import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

describe('GET /api/collection/lookup', () => {
  test('returns 401 when not authenticated', async () => {
    currentMock = createQueuedSupabaseMock(null, []);
    const { GET } = await import('@/app/api/collection/lookup/route');
    const req = new NextRequest('http://localhost/api/collection/lookup?game_id=g1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  test('returns 400 when game_id missing', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { GET } = await import('@/app/api/collection/lookup/route');
    const req = new NextRequest('http://localhost/api/collection/lookup');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  test('returns entry when row exists', async () => {
    const entry = { id: 'ug1', status: 'playing', lendable: true };
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, [{ data: entry, error: null }]);
    const { GET } = await import('@/app/api/collection/lookup/route');
    const req = new NextRequest('http://localhost/api/collection/lookup?game_id=g99');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entry).toEqual(entry);
  });

  test('returns null entry when not in collection', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, [{ data: null, error: null }]);
    const { GET } = await import('@/app/api/collection/lookup/route');
    const req = new NextRequest('http://localhost/api/collection/lookup?game_id=g99');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entry).toBeNull();
  });

  test('returns 500 when Supabase errors', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [{ data: null, error: { message: 'db down' } }],
    );
    const { GET } = await import('@/app/api/collection/lookup/route');
    const req = new NextRequest('http://localhost/api/collection/lookup?game_id=g1');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
