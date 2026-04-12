import { describe, expect, mock, test } from 'bun:test';
import { NextRequest } from 'next/server';
import { createQueuedSupabaseMock } from '../../test/supabase-mock';

let currentMock: ReturnType<typeof createQueuedSupabaseMock>;

mock.module('@/lib/supabase/server', () => ({
  createClient: () => currentMock,
}));

describe('GET /api/loans', () => {
  test('401 when anonymous', async () => {
    currentMock = createQueuedSupabaseMock(null, []);
    const { GET } = await import('@/app/api/loans/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  test('200 returns loans', async () => {
    const loans = [{ id: 'l1', status: 'requested' }];
    currentMock = createQueuedSupabaseMock({ id: 'u1' }, [{ data: loans, error: null }]);
    const { GET } = await import('@/app/api/loans/route');
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(loans);
  });
});

describe('POST /api/loans', () => {
  test('400 when fields missing', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'borrower' }, []);
    const { POST } = await import('@/app/api/loans/route');
    const req = new NextRequest('http://localhost/api/loans', {
      method: 'POST',
      body: JSON.stringify({ game_id: 'g1' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('400 when borrowing from self', async () => {
    currentMock = createQueuedSupabaseMock({ id: 'same' }, []);
    const { POST } = await import('@/app/api/loans/route');
    const req = new NextRequest('http://localhost/api/loans', {
      method: 'POST',
      body: JSON.stringify({
        game_id: 'g1',
        owner_id: 'same',
        group_id: 'grp',
      }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  test('403 when borrower not in group', async () => {
    currentMock = createQueuedSupabaseMock(
      { id: 'borrower' },
      [{ data: null, error: null }],
    );
    const { POST } = await import('@/app/api/loans/route');
    const req = new NextRequest('http://localhost/api/loans', {
      method: 'POST',
      body: JSON.stringify({
        game_id: 'g1',
        owner_id: 'owner',
        group_id: 'grp',
      }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  test('201 creates loan when checks pass', async () => {
    const created = { id: 'loan1', status: 'requested', game: { title: 'X' } };
    currentMock = createQueuedSupabaseMock(
      { id: 'borrower' },
      [
        { data: { id: 'm1' }, error: null },
        { data: { id: 'm2' }, error: null },
        { data: { id: 'ug1', lendable: true }, error: null },
        { data: null, error: null },
        { data: created, error: null },
      ],
    );
    const { POST } = await import('@/app/api/loans/route');
    const req = new NextRequest('http://localhost/api/loans', {
      method: 'POST',
      body: JSON.stringify({
        game_id: 'g1',
        owner_id: 'owner',
        group_id: 'grp',
      }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
  });
});
