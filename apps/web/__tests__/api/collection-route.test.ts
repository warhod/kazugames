import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

describe('GET /api/collection', () => {
  test('returns 401 when not authenticated', async () => {
    currentMock = createQueuedSupabaseMock(null, []);
    const { GET } = await import('@/app/api/collection/route');
    const res = await GET(new NextRequest('http://localhost/api/collection'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('returns user games when authenticated', async () => {
    const rows = [{ id: 'ug1', user_id: 'u1', game_id: 'g1', status: 'owned', game: { title: 'Zelda' } }];
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [
        { data: null, error: null, count: 1 },
        { data: null, error: null, count: 1 },
        { data: null, error: null, count: 0 },
        { data: null, error: null, count: 0 },
        { data: null, error: null, count: 0 },
        { data: null, error: null, count: 0 },
        { data: null, error: null, count: 1 },
        { data: rows, error: null },
      ],
    );
    const { GET } = await import('@/app/api/collection/route');
    const res = await GET(
      new NextRequest('http://localhost/api/collection?page=1&per_page=20'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual(rows);
    expect(body.total).toBe(1);
    expect(body.filtered_total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.per_page).toBe(20);
    expect(body.status_counts.owned).toBe(1);
    expect(body.lendable_count).toBe(1);
  });

  test('returns 500 when Supabase errors', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [{ data: null, error: { message: 'db down' } }],
    );
    const { GET } = await import('@/app/api/collection/route');
    const res = await GET(new NextRequest('http://localhost/api/collection'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/collection', () => {
  test('returns 400 when body missing fields', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { POST } = await import('@/app/api/collection/route');
    const req = new NextRequest('http://localhost/api/collection', {
      method: 'POST',
      body: JSON.stringify({ game_id: 'g1' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('returns 400 for invalid status', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, []);
    const { POST } = await import('@/app/api/collection/route');
    const req = new NextRequest('http://localhost/api/collection', {
      method: 'POST',
      body: JSON.stringify({ game_id: 'g1', status: 'invalid' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('returns 409 when game already in collection', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [{ data: { id: 'existing' }, error: null }],
    );
    const { POST } = await import('@/app/api/collection/route');
    const req = new NextRequest('http://localhost/api/collection', {
      method: 'POST',
      body: JSON.stringify({ game_id: 'g1', status: 'owned' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  test('returns 201 on insert', async () => {
    const inserted = { id: 'ug-new', game_id: 'g1', status: 'owned', game: { title: 'Mario' } };
    currentMock = createQueuedSupabaseMock(
      { id: 'u1' },
      [
        { data: null, error: null },
        { data: inserted, error: null },
      ],
    );
    const { POST } = await import('@/app/api/collection/route');
    const req = new NextRequest('http://localhost/api/collection', {
      method: 'POST',
      body: JSON.stringify({ game_id: 'g1', status: 'owned' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(inserted);
  });
});
